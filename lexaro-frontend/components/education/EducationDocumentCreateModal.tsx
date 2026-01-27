'use client';

import { useMemo, useRef, useState } from 'react';
import { X, FileUp, FileText } from 'lucide-react';
import { uploadDocument } from '@/lib/documents';

type Props = {
    open: boolean;
    onClose: () => void;
    onCreated?: (docId: number) => void;
};

const MAX_SIZE_MB = 50;
const ACCEPTED_EXTS = ['pdf', 'doc', 'docx', 'txt', 'epub', 'rtf', 'html', 'htm'];

function cn(...classes: Array<string | undefined | false | null>) {
    return classes.filter(Boolean).join(' ');
}

function validateFile(file: File): string | null {
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_SIZE_MB) return `File is too large (${sizeMB.toFixed(1)} MB). Max is ${MAX_SIZE_MB} MB.`;
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ACCEPTED_EXTS.includes(ext)) return `Unsupported file type ".${ext}". Try: ${ACCEPTED_EXTS.join(', ')}`;
    return null;
}

export default function EducationDocumentCreateModal({ open, onClose, onCreated }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);

    const [mode, setMode] = useState<'upload' | 'text'>('upload');

    const [busy, setBusy] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');

    const [title, setTitle] = useState('');
    const [text, setText] = useState('');

    const textChars = useMemo(() => (text ?? '').length, [text]);

    async function doUpload(file: File) {
        setError('');
        const v = validateFile(file);
        if (v) {
            setError(v);
            return;
        }

        setBusy(true);
        setProgress(0);
        try {
            // ✅ IMPORTANT: purpose is EDUCATION (no voice picker here)
            const { id } = await uploadDocument(file, (p) => setProgress(p), 'EDUCATION');
            onCreated?.(id);
            onClose();
        } catch (e: any) {
            setError(e?.message || 'Upload failed. Please try again.');
        } finally {
            setBusy(false);
            setProgress(0);
        }
    }

    async function onPickFile(files: FileList | null) {
        if (!files || !files.length) return;
        await doUpload(files[0]);
    }

    async function onDrop(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
        e.stopPropagation();
        const f = e.dataTransfer?.files?.[0];
        if (f) await doUpload(f);
    }

    async function onCreateFromText() {
        setError('');
        const body = (text || '').trim();
        if (!body) {
            setError('Please paste some text.');
            return;
        }

        const safeName = (title || 'Education notes').trim() || 'Education notes';
        const filename = safeName.endsWith('.txt') ? safeName : `${safeName}.txt`;

        const file = new File([body], filename, { type: 'text/plain' });
        await doUpload(file);
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[200]">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative mx-auto mt-10 w-[92vw] max-w-2xl rounded-2xl border border-white/10 bg-black/80 shadow-[0_20px_80px_rgba(0,0,0,.7)]">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl border border-white/10 bg-white/5 grid place-items-center">
                            {mode === 'upload' ? <FileUp className="h-5 w-5 text-white/80" /> : <FileText className="h-5 w-5 text-white/80" />}
                        </div>
                        <div>
                            <div className="font-semibold">Add Education Document</div>
                            <div className="text-xs text-white/60">Uploads here are for Education only (no audio prompt).</div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="h-10 w-10 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 grid place-items-center transition"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5 text-white/80" />
                    </button>
                </div>

                <div className="px-5 pt-4">
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setMode('upload')}
                            className={cn(
                                'px-4 py-2 rounded-xl border text-sm font-semibold transition',
                                mode === 'upload'
                                    ? 'bg-[#009FFD] text-black border-transparent'
                                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                            )}
                        >
                            Upload file
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('text')}
                            className={cn(
                                'px-4 py-2 rounded-xl border text-sm font-semibold transition',
                                mode === 'text'
                                    ? 'bg-[#009FFD] text-black border-transparent'
                                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                            )}
                        >
                            Paste text
                        </button>
                    </div>

                    {error ? <div className="mt-4 text-sm text-red-300">{error}</div> : null}

                    {mode === 'upload' ? (
                        <div className="mt-4">
                            <div
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={onDrop}
                                className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center"
                            >
                                <div className="text-white/80 font-semibold">Drag & drop a file here</div>
                                <div className="text-xs text-white/60 mt-1">
                                    Supported: {ACCEPTED_EXTS.join(', ')} · Max {MAX_SIZE_MB}MB
                                </div>

                                <input
                                    ref={inputRef}
                                    type="file"
                                    className="hidden"
                                    accept={ACCEPTED_EXTS.map((e) => '.' + e).join(',')}
                                    onChange={(e) => onPickFile(e.target.files)}
                                />

                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => inputRef.current?.click()}
                                    className="mt-4 px-4 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 transition disabled:opacity-60"
                                >
                                    Choose file
                                </button>

                                {busy ? (
                                    <div className="mt-4 text-sm text-white/70">
                                        Uploading… {Math.round(progress)}%
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    ) : (
                        <div className="mt-4">
                            <label className="text-sm text-white/70">Title (optional)</label>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Biology Chapter 3"
                                className="mt-2 w-full px-4 py-2 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-white/25"
                            />

                            <label className="mt-4 block text-sm text-white/70">Text</label>
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Paste notes or a chapter…"
                                rows={10}
                                className="mt-2 w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-white/25"
                            />
                            <div className="mt-2 text-xs text-white/50">{textChars.toLocaleString()} chars</div>

                            <div className="mt-4 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={busy || !text.trim()}
                                    onClick={onCreateFromText}
                                    className="px-4 py-2 rounded-xl bg-[#009FFD] text-black font-semibold hover:opacity-90 transition disabled:opacity-60"
                                >
                                    Save to Education
                                </button>
                            </div>

                            {busy ? (
                                <div className="mt-3 text-sm text-white/70">
                                    Uploading… {Math.round(progress)}%
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>

                <div className="px-5 py-4">
                    <div className="text-xs text-white/50">
                        Tip: You can generate audio later from inside the document page (Audio button).
                    </div>
                </div>
            </div>
        </div>
    );
}
