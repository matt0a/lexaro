"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X, FileText } from "lucide-react";
import { uploadDocument, startAudio } from "@/lib/documents";

import VoicePickerModal, {
    type PickedVoice,
    type VoiceMeta,
} from "@/components/voices/VoicePickerModal";

import FreeVoicePickModal from "@/components/upload/FreeVoicePickModal";
import api from "@/lib/api";

type Props = {
    open: boolean;
    plan: string;
    onClose: () => void;
    onSaved: (docId: number) => void;
};

/** Matches /tts/voices */
type VoiceDto = {
    id: string;
    title: string | null;
    provider: "speechify" | "polly";
    language: string | null;
    region: string | null;
    gender: string | null;
    attitude: string | null;
    preview: string | null;
};

// local type for free picker
type SimplePickedVoice = { voiceId: string; title: string };

function cn(...classes: Array<string | undefined | false | null>) {
    return classes.filter(Boolean).join(" ");
}

function prefersReducedMotion() {
    if (typeof window === "undefined") return false;
    return !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
}

// ---- curated paid voices (English 20 + 6 langs x 4) ----
const MAJOR_LANGS = ["Spanish", "French", "Portuguese", "German", "Arabic", "Hindi"] as const;

/**
 * English “popular-first” order based on Speechify’s public “most popular voices” section
 * + we FORCE include Kristy, June, Mason.
 *
 * Note: These are matched against BOTH `id` and `title`.
 */
const MUST_HAVE_ENGLISH = ["kristy", "june", "mason"] as const;

const POPULAR_ENGLISH_ORDER = [
    // force in-app favorites / must-haves
    "kristy",
    "june",
    "mason",

    // Speechify “most popular voices” page names (public)
    "gwyneth",
    "snoop",
    "cliff weitzman",
    "mrbeast",
    "nate",
    "ali abdaal",
    "benjamin",
    "erica",
    "henry",
    "joe",
    "carly",
    "oliver",
    "ben wilson",
    "john",
    "emma",
    "jamie",
    "tasha",
    "mary",
    "lisa",
    "george",
    "rob",
    "jessica",
    "aria",
    "sally",
    "simon",
    "keenan",
    "leah",
] as const;

function normalizeLang(raw?: string | null) {
    const s = (raw ?? "").trim();
    if (!s) return "Other";
    const lower = s.toLowerCase();

    if (lower.startsWith("en")) return "English";
    if (lower.startsWith("es")) return "Spanish";
    if (lower.startsWith("fr")) return "French";
    if (lower.startsWith("pt")) return "Portuguese";
    if (lower.startsWith("de")) return "German";
    if (lower.startsWith("ar")) return "Arabic";
    if (lower.startsWith("hi")) return "Hindi";

    if (lower.includes("english")) return "English";
    if (lower.includes("spanish")) return "Spanish";
    if (lower.includes("french")) return "French";
    if (lower.includes("portuguese")) return "Portuguese";
    if (lower.includes("german")) return "German";
    if (lower.includes("arabic")) return "Arabic";
    if (lower.includes("hindi")) return "Hindi";

    return s;
}

function normalizeGender(g?: string | null): VoiceMeta["gender"] {
    const s = (g ?? "").trim().toLowerCase();
    if (s.startsWith("f")) return "Female";
    if (s.startsWith("m")) return "Male";
    return "Other";
}

function keyify(s: string) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function stableVoiceSort(a: VoiceMeta, b: VoiceMeta) {
    const ap = a.preview ? 1 : 0;
    const bp = b.preview ? 1 : 0;
    if (ap !== bp) return bp - ap; // preview first

    // prefer speechify first
    const aProv = a.provider === "speechify" ? 0 : 1;
    const bProv = b.provider === "speechify" ? 0 : 1;
    if (aProv !== bProv) return aProv - bProv;

    return (a.title ?? a.id).localeCompare(b.title ?? b.id);
}

function pickByGender(list: VoiceMeta[], wantFemale: number, wantMale: number) {
    const females = list.filter((v) => v.gender === "Female").sort(stableVoiceSort);
    const males = list.filter((v) => v.gender === "Male").sort(stableVoiceSort);
    const others = list.filter((v) => v.gender !== "Female" && v.gender !== "Male").sort(stableVoiceSort);

    const picked: VoiceMeta[] = [];
    picked.push(...females.slice(0, wantFemale));
    picked.push(...males.slice(0, wantMale));

    const totalWanted = wantFemale + wantMale;
    if (picked.length < totalWanted) {
        const usedIds = new Set(picked.map((p) => p.id));
        const pool = [...females, ...males, ...others].filter((v) => !usedIds.has(v.id));
        picked.push(...pool.slice(0, totalWanted - picked.length));
    }

    return picked.sort(stableVoiceSort);
}

/**
 * English 20: popular-first (by id/title), then fill remaining by preview/provider/gender.
 */
function pickEnglish20Popular(all: VoiceMeta[]) {
    const english = all.filter((v) => v.language === "English");

    // quick lookup by multiple keys
    const byKey = new Map<string, VoiceMeta[]>();
    for (const v of english) {
        const keys = new Set<string>();
        keys.add(keyify(v.id));
        if (v.title) keys.add(keyify(v.title));
        // sometimes people have titles with spaces; id without, etc.
        for (const k of keys) {
            const arr = byKey.get(k) ?? [];
            arr.push(v);
            byKey.set(k, arr);
        }
    }

    const picked: VoiceMeta[] = [];
    const used = new Set<string>();

    // 1) Force must-haves
    for (const name of MUST_HAVE_ENGLISH) {
        const candidates = byKey.get(keyify(name)) ?? [];
        const best = candidates.sort(stableVoiceSort)[0];
        if (best && !used.has(best.id)) {
            picked.push(best);
            used.add(best.id);
        }
    }

    // 2) Add popular order
    for (const name of POPULAR_ENGLISH_ORDER) {
        const candidates = byKey.get(keyify(name)) ?? [];
        const best = candidates.sort(stableVoiceSort)[0];
        if (best && !used.has(best.id)) {
            picked.push(best);
            used.add(best.id);
        }
        if (picked.length >= 20) break;
    }

    // 3) Fill remaining up to 20 (prefer preview + speechify)
    if (picked.length < 20) {
        const rest = english.filter((v) => !used.has(v.id)).sort(stableVoiceSort);

        // mild gender balancing during fill (not strict)
        const females = rest.filter((v) => v.gender === "Female");
        const males = rest.filter((v) => v.gender === "Male");
        const others = rest.filter((v) => v.gender !== "Female" && v.gender !== "Male");

        const fill: VoiceMeta[] = [];
        // alternate a bit
        fill.push(...females.slice(0, 10));
        fill.push(...males.slice(0, 10));
        fill.push(...others);

        for (const v of fill) {
            if (picked.length >= 20) break;
            if (!used.has(v.id)) {
                picked.push(v);
                used.add(v.id);
            }
        }
    }

    return picked.slice(0, 20);
}

function curateVoices(all: VoiceMeta[]) {
    const english20 = pickEnglish20Popular(all);

    const majors = MAJOR_LANGS.flatMap((lang) => {
        const inLang = all.filter((v) => v.language === lang);
        return pickByGender(inLang, 2, 2);
    });

    // dedupe + order
    const seen = new Set<string>();
    const final: VoiceMeta[] = [];
    for (const v of [...english20, ...majors]) {
        if (seen.has(v.id)) continue;
        seen.add(v.id);
        final.push(v);
    }

    const entries: Array<[string, number]> = [
        ["English", 0],
        ...MAJOR_LANGS.map((l, i) => [l, i + 1] as [string, number]),
    ];
    const langOrder = new Map<string, number>(entries);

    final.sort((a, b) => {
        const la = langOrder.get(a.language ?? "") ?? 999;
        const lb = langOrder.get(b.language ?? "") ?? 999;
        if (la !== lb) return la - lb;
        return stableVoiceSort(a, b);
    });

    return final;
}

export default function AddTextModal({ open, plan, onClose, onSaved }: Props) {
    const [title, setTitle] = useState("");
    const [text, setText] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string>("");

    const [pendingDocId, setPendingDocId] = useState<number | null>(null);

    // PAID picker
    const [showVoice, setShowVoice] = useState(false);
    const [catalog, setCatalog] = useState<VoiceMeta[]>([]);

    // FREE picker
    const [showFreeVoice, setShowFreeVoice] = useState(false);
    const [lastFreeVoice, setLastFreeVoice] = useState<SimplePickedVoice | null>(null);

    const upperPlan = plan?.toUpperCase?.() || "FREE";
    const isFree = upperPlan === "FREE";
    const allowPolly = isFree; // keep your original logic

    const panelRef = useRef<HTMLDivElement | null>(null);
    const textRef = useRef<HTMLTextAreaElement | null>(null);

    const [mounted, setMounted] = useState(false);
    const reduceMotion = useMemo(() => prefersReducedMotion(), []);

    // Load catalog only when paid picker opens
    useEffect(() => {
        if (!showVoice) return;

        (async () => {
            try {
                const { data } = await api.get<VoiceDto[]>("/tts/voices", { params: { plan: upperPlan } });
                const list = Array.isArray(data) ? data : [];

                const mapped: VoiceMeta[] = list.map((v) => ({
                    id: v.id,
                    title: (v.title ?? v.id) || v.id,
                    language: normalizeLang(v.language),
                    region: v.region ?? "Other",
                    attitude: v.attitude ?? "",
                    gender: normalizeGender(v.gender),
                    provider: v.provider,
                    // NOTE: VoicePickerModal currently types preview as undefined only.
                    // We'll keep it undefined here until you change VoicePickerModal type.
                    preview: undefined,
                    avatar: undefined,
                    flagEmoji: undefined,
                    favorite: false,
                }));

                setCatalog(curateVoices(mapped));
            } catch {
                setCatalog([]);
            }
        })();
    }, [showVoice, upperPlan]);

    // Open animation + focus
    useEffect(() => {
        if (!open) return;

        setError("");
        setMounted(false);

        const raf = requestAnimationFrame(() => setMounted(true));
        const t = window.setTimeout(() => textRef.current?.focus(), 90);

        return () => {
            cancelAnimationFrame(raf);
            window.clearTimeout(t);
        };
    }, [open]);

    // ESC close
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open) return null;

    const resetForm = () => {
        setTitle("");
        setText("");
    };

    const handleSave = async () => {
        setError("");
        if (!text.trim()) {
            setError("Please enter some text.");
            return;
        }

        const nameBase =
            (title || "Untitled").replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-").slice(0, 50) || "Text";

        const filename = `${nameBase}-${Date.now()}.txt`;
        const file = new File([new Blob([text], { type: "text/plain" })], filename, { type: "text/plain" });

        setBusy(true);
        try {
            const { id } = await uploadDocument(file);
            setPendingDocId(id);
            if (isFree) setShowFreeVoice(true);
            else setShowVoice(true);
        } catch (e: any) {
            setError(e?.message || "Failed to save text. Please try again.");
        } finally {
            setBusy(false);
        }
    };

    const charCount = text.length;

    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div
                className={cn(
                    "absolute inset-0 bg-black/60 backdrop-blur-[6px] transition-opacity duration-200",
                    mounted ? "opacity-100" : "opacity-0"
                )}
                onClick={onClose}
            />

            {/* Dialog */}
            <div
                role="dialog"
                aria-modal="true"
                className="absolute inset-0 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <div
                    ref={panelRef}
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                        "w-full max-w-2xl overflow-hidden",
                        "rounded-3xl border border-white/10",
                        "bg-black/70 backdrop-blur-xl",
                        "shadow-[0_30px_120px_rgba(0,0,0,.75)]",
                        "transition-all duration-200 ease-out will-change-transform",
                        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
                        reduceMotion ? "scale-100" : mounted ? "scale-100" : "scale-[0.98]"
                    )}
                >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-white/10">
                        <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-2xl border border-white/10 bg-white/[0.06] grid place-items-center">
                                <FileText className="h-5 w-5 text-white/80" />
                            </div>

                            <div>
                                <div className="text-sm tracking-[0.22em] uppercase text-white/45">Add Text</div>
                                <div className="mt-1 text-[13px] text-white/60">
                                    Paste notes or a chapter, then pick a voice to generate audio.
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="h-10 w-10 rounded-2xl border border-white/10 bg-white/[0.06] hover:bg-white/[0.10] transition grid place-items-center"
                            aria-label="Close"
                            type="button"
                        >
                            <X className="h-5 w-5 text-white/80" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-6 space-y-4">
                        {/* Title */}
                        <div>
                            <label className="block text-xs font-semibold text-white/70 mb-2">
                                Title <span className="text-white/35 font-normal">(optional)</span>
                            </label>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Chapter 3 Notes"
                                className={cn(
                                    "w-full h-11 rounded-2xl px-4",
                                    "border border-white/10 bg-white/[0.04]",
                                    "text-sm text-white/90 placeholder:text-white/30",
                                    "outline-none transition",
                                    "focus:border-sky-400/40 focus:ring-4 focus:ring-sky-400/10"
                                )}
                            />
                        </div>

                        {/* Text */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-xs font-semibold text-white/70">Text</label>
                                <div className="text-[11px] text-white/40">{charCount.toLocaleString()} chars</div>
                            </div>

                            <textarea
                                ref={textRef}
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Type or paste text here…"
                                rows={10}
                                className={cn(
                                    "w-full min-h-[280px] resize-y rounded-2xl p-4",
                                    "border border-white/10 bg-white/[0.04]",
                                    "text-sm leading-6 text-white/90 placeholder:text-white/30",
                                    "outline-none transition",
                                    "focus:border-sky-400/40 focus:ring-4 focus:ring-sky-400/10"
                                )}
                            />

                            <div className="mt-2 text-[11px] text-white/45">
                                Tip: punctuation/newlines help read-along sentence splitting.
                            </div>
                        </div>

                        {error ? (
                            <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                {error}
                            </div>
                        ) : null}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-5 border-t border-white/10 flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={busy}
                            className="h-11 px-4 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition text-sm font-semibold text-white/80 disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            onClick={handleSave}
                            disabled={busy || !text.trim()}
                            className={cn(
                                "h-11 px-5 rounded-2xl text-sm font-semibold text-white",
                                "border border-sky-400/30",
                                "bg-gradient-to-r from-sky-500/80 via-indigo-500/70 to-fuchsia-500/70",
                                "shadow-[0_14px_40px_rgba(56,189,248,.18)]",
                                "hover:brightness-110 transition",
                                "disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                        >
                            {busy ? "Saving…" : isFree ? "Save & pick a voice" : "Save & choose voice"}
                        </button>
                    </div>
                </div>
            </div>

            {/* PAID voice picker */}
            <VoicePickerModal
                open={showVoice}
                voices={catalog}
                allowPolly={allowPolly}
                initialLang={undefined}
                onClose={() => {
                    setShowVoice(false);
                    setPendingDocId(null);
                }}
                onPick={async (v: PickedVoice) => {
                    if (!pendingDocId) return;
                    try {
                        await startAudio(pendingDocId, { voiceId: v.voiceId, engine: "neural", format: "mp3" });
                        onSaved(pendingDocId);
                        onClose();
                        resetForm();
                    } catch (e: any) {
                        setError(e?.message || "Failed to start audio.");
                    } finally {
                        setShowVoice(false);
                        setPendingDocId(null);
                    }
                }}
            />

            {/* FREE voice picker */}
            <FreeVoicePickModal
                open={showFreeVoice}
                initialVoiceId={lastFreeVoice?.voiceId ?? null}
                onClose={() => {
                    setShowFreeVoice(false);
                    setPendingDocId(null);
                }}
                onPick={async (picked: SimplePickedVoice) => {
                    if (!pendingDocId) return;
                    try {
                        await startAudio(pendingDocId, { voice: picked.voiceId, engine: "standard", format: "mp3" });
                        setLastFreeVoice(picked);
                        onSaved(pendingDocId);
                        onClose();
                        resetForm();
                    } catch (e: any) {
                        setError(e?.message || "Failed to start audio.");
                    } finally {
                        setShowFreeVoice(false);
                        setPendingDocId(null);
                    }
                }}
            />
        </div>
    );
}
