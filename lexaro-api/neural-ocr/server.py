from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from PIL import Image
import io, time, base64
import numpy as np

# OpenCV-based preprocessing
import cv2
import easyocr

app = FastAPI()

# languages via query (?lang=en,de,fr), default to en
def build_reader(langs):
    return easyocr.Reader(langs, gpu=False)

# keep one reader; swap if langs change
_reader_langs = ('en',)
reader = build_reader(list(_reader_langs))

@app.get("/health")
def health():
    return {"ok": True}

def pil_to_np(im: Image.Image) -> np.ndarray:
    return cv2.cvtColor(np.array(im), cv2.COLOR_RGB2BGR)

def np_to_pil(arr: np.ndarray) -> Image.Image:
    return Image.fromarray(cv2.cvtColor(arr, cv2.COLOR_BGR2RGB))

def preprocess_variants(img_bgr: np.ndarray):
    """Yield (name, bgr_img) variants."""
    h, w = img_bgr.shape[:2]
    # base
    yield ("orig", img_bgr)

    # grayscale + CLAHE
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8)).apply(gray)
    clahe_bgr = cv2.cvtColor(clahe, cv2.COLOR_GRAY2BGR)
    yield ("clahe", clahe_bgr)

    # adaptive threshold (good for uneven lighting)
    adap = cv2.adaptiveThreshold(gray, 255,
                                 cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                 cv2.THRESH_BINARY, 31, 12)
    adap_bgr = cv2.cvtColor(adap, cv2.COLOR_GRAY2BGR)
    yield ("adapth", adap_bgr)

    # inverted
    inv = cv2.bitwise_not(adap)
    inv_bgr = cv2.cvtColor(inv, cv2.COLOR_GRAY2BGR)
    yield ("invert", inv_bgr)

    # light morphology to reconnect broken strokes
    kernel = np.ones((2, 2), np.uint8)
    close = cv2.morphologyEx(adap, cv2.MORPH_CLOSE, kernel, iterations=1)
    close_bgr = cv2.cvtColor(close, cv2.COLOR_GRAY2BGR)
    yield ("morph_close", close_bgr)

def rotations(bgr: np.ndarray):
    """Yield (angle, bgr_img) for 0,90,180,270."""
    yield (0, bgr)
    yield (90, cv2.rotate(bgr, cv2.ROTATE_90_CLOCKWISE))
    yield (180, cv2.rotate(bgr, cv2.ROTATE_180))
    yield (270, cv2.rotate(bgr, cv2.ROTATE_90_COUNTERCLOCKWISE))

@app.post("/ocr")
async def ocr(req: Request):
    # optional lang list via query: /ocr?lang=en,de
    lang_q = req.query_params.get("lang", "en")
    langs = tuple([x.strip() for x in lang_q.split(",") if x.strip()]) or ('en',)

    global reader, _reader_langs
    if langs != _reader_langs:
        _reader_langs = langs
        reader = build_reader(list(langs))

    body = await req.body()

    # verify it’s an image we can open
    try:
        pil = Image.open(io.BytesIO(body)).convert("RGB")
    except Exception:
        return JSONResponse({"text": "", "stats": {"error": "bad_image"}})

    img_bgr = pil_to_np(pil)

    t0 = time.time()
    best_text = ""
    best_meta = ("", 0)  # (variant_name, angle)

    # try variants x rotations; short-circuit if we get decent text
    tried = 0
    for vname, vimg in preprocess_variants(img_bgr):
        for angle, rimg in rotations(vimg):
            tried += 1
            # easyocr accepts numpy arrays directly
            result = reader.readtext(rimg, detail=0, paragraph=True)
            txt = "\n".join(x.strip() for x in result if x and x.strip())
            if len(txt) > len(best_text):
                best_text = txt
                best_meta = (vname, angle)
            # if we get "enough" text, bail early
            if len(best_text) >= 200:
                break
        if len(best_text) >= 200:
            break

    took_ms = int((time.time() - t0) * 1000)
    h, w = img_bgr.shape[:2]
    return JSONResponse({
        "text": best_text,
        "stats": {
            "w": w, "h": h,
            "took_ms": took_ms,
            "variants_tried": tried,
            "best_len": len(best_text),
            "best_variant": best_meta[0],
            "best_angle": best_meta[1],
            "langs": list(langs)
        }
    })
