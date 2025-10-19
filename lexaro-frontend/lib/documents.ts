// lib/documents.ts
import api from './api';

export type PresignUploadRequest = {
    filename: string;
    mime: string;
    sizeBytes: number;
    pages?: number | null;
};

export type RawPresignResponse = {
    // Backend may use either of these keys
    id?: number;
    documentId?: number;

    url: string;
    method?: 'PUT' | 'POST';
    headers?: Record<string, string>; // required headers for PUT
    fields?: Record<string, string>;  // POST policy fields
};

export type PresignUploadResponse = {
    docId: number;
    url: string;
    method: 'PUT' | 'POST';
    headers?: Record<string, string>;
    fields?: Record<string, string>;
};

export type UploadedDoc = { id: number };

// --- Helpers ---------------------------------------------------------------

function normalizePresign(r: RawPresignResponse): PresignUploadResponse {
    const docId = (r.documentId ?? r.id);
    if (!docId) {
        throw new Error('Presign response missing document id (expected "id" or "documentId").');
    }
    return {
        docId,
        url: r.url,
        method: (r.method ?? 'PUT'),
        headers: r.headers,
        fields: r.fields,
    };
}

function guessMime(name: string): string | null {
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'pdf':  return 'application/pdf';
        case 'doc':  return 'application/msword';
        case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        case 'txt':  return 'text/plain';
        case 'epub': return 'application/epub+zip';
        case 'rtf':  return 'application/rtf';
        case 'html':
        case 'htm':  return 'text/html';
        default:     return null;
    }
}

// --- API -------------------------------------------------------------------

export async function presignUpload(req: PresignUploadRequest) {
    const { data } = await api.post<RawPresignResponse>('/documents/presign', req);
    return normalizePresign(data);
}

// IMPORTANT: send *exactly* the headers/fields the backend signed.
// Do NOT invent Content-Type unless it is explicitly present.
export async function uploadToStorage(
    presign: PresignUploadResponse,
    file: File,
    _mime: string,                                   // kept for parity; not auto-applied
    onProgress?: (percent: number) => void
) {
    await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (evt) => {
            if (onProgress && evt.lengthComputable) {
                onProgress((evt.loaded / evt.total) * 100);
            }
        };
        xhr.onerror = () => reject(new Error('Upload failed (network error)'));
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) return resolve();
            reject(new Error(`Upload failed (${xhr.status})`));
        };

        if (presign.method === 'PUT') {
            xhr.open('PUT', presign.url, true);

            // Only set the exact headers the backend provided
            if (presign.headers) {
                Object.entries(presign.headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
            }

            // Do NOT set a Content-Type unless it’s part of presign.headers.
            xhr.send(file);
        } else {
            // POST policy (multipart form)
            xhr.open('POST', presign.url, true);
            const fd = new FormData();

            if (presign.fields) {
                Object.entries(presign.fields).forEach(([k, v]) => fd.append(k, v));
            }
            fd.append('file', file);

            xhr.send(fd);
        }
    });
}

export async function completeUpload(
    docId: number,
    extra?: Partial<{ filename: string; mime: string; sizeBytes: number }>
) {
    const { data } = await api.post<{ id: number }>(`/documents/${docId}/complete`, extra ?? {});
    return data;
}

export async function uploadDocument(
    file: File,
    onProgress?: (pct: number) => void
): Promise<UploadedDoc> {
    const mime = file.type || guessMime(file.name) || 'application/octet-stream';

    // 1) presign
    const presign = await presignUpload({
        filename: file.name,
        mime,
        sizeBytes: file.size,
    });

    // 2) upload to storage — honor ONLY signed headers/fields
    await uploadToStorage(presign, file, mime, onProgress);

    // 3) complete
    await completeUpload(presign.docId, {
        filename: file.name,
        mime,
        sizeBytes: file.size,
    });

    return { id: presign.docId };
}

export async function startAudio(
    docId: number,
    opts: { voice?: string | null; voiceId?: string | null; engine?: string | null; format?: string | null }
) {
    const payload: any = {
        voice: opts.voice ?? null,
        voice_id: opts.voiceId ?? null,
        engine: opts.engine ?? null,
        format: opts.format ?? 'mp3',
    };
    if (opts.voiceId != null) payload.voice_id = opts.voiceId;
    else payload.voice = opts.voice ?? null;

    await api.post(`/documents/${docId}/audio/start`, payload);
}