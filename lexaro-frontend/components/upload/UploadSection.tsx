'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileUp, Type, AlertTriangle } from 'lucide-react';
import AudioStatus from '@/components/dashboard/AudioStatus';
import AddTextModal from '@/components/upload/AddTextModal';
import { uploadDocument, startAudio } from '@/lib/documents';

import VoicePickerModal, {
    type PickedVoice as PaidPickedVoice,
    type VoiceMeta,
} from '@/components/voices/VoicePickerModal';

import FreeVoicePickModal from '@/components/upload/FreeVoicePickModal';
import api from '@/lib/api';

type Props = {
    plan: string;
    initialOpenUpload?: boolean;
};

const MAX_SIZE_MB = 50;
const ACCEPTED_EXTS = ['pdf', 'doc', 'docx', 'txt', 'epub', 'rtf', 'html', 'htm'];

type VoiceDto = {
    id: string;
    title: string | null;
    provider: 'speechify' | 'polly';
    language: string | null;
    region: string | null;
    gender: string | null;
    attitude: string | null;
    preview: string | null;
};

type SimplePickedVoice = { voiceId: string; title: string };

export default function UploadSection({ plan, initialOpenUpload = false }: Props) {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    const [dragOver, setDragOver] = useState(false);
    const [docId, setDocId] = useState<number | null>(null);
    const [busy, setBusy] = useState(false);
    const [progress, setProgress] = useState<number>(0);
    const [error, setError] = useState<string>('');
    const [showText, setShowText] = useState<boolean>(initialOpenUpload);

    // ✅ used for redirect title
    const [lastDocName, setLastDocName] = useState<string | null>(null);

    const [pendingDocId, setPendingDocId] = useState<number | null>(null);

    const [showVoice, setShowVoice] = useState(false);

    const [showFreeVoice, setShowFreeVoice] = useState(false);
    const [lastFreeVoice, setLastFreeVoice] = useState<SimplePickedVoice | null>(null);

    const [catalog, setCatalog] = useState<VoiceMeta[]>([]);

    const upperPlan = plan?.toUpperCase?.() || 'FREE';
    const isFree = upperPlan === 'FREE';
    const isPaid = !isFree;

    useEffect(() => {
        if (initialOpenUpload) setShowText(true);
    }, [initialOpenUpload]);

    const normalizeGender = (g?: string | null): VoiceMeta['gender'] => {
        const s = (g ?? '').trim().toLowerCase();
        if (s.startsWith('f')) return 'Female';
        if (s.startsWith('m')) return 'Male';
        return 'Other';
    };

    const validate = (file: File): string | null => {
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > MAX_SIZE_MB) return `File is too large (${sizeMB.toFixed(1)} MB). Max is ${MAX_SIZE_MB} MB.`;
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        if (!ACCEPTED_EXTS.includes(ext)) return `Unsupported file type ".${ext}". Try: ${ACCEPTED_EXTS.join(', ')}`;
        return null;
    };

    useEffect(() => {
        if (!isPaid) return;

        (async () => {
            const { data } = await api.get<VoiceDto[]>('/tts/voices', { params: { plan: upperPlan } });
            const list = Array.isArray(data) ? data : [];
            const mapped: VoiceMeta[] = list.map((v) => ({
                id: v.id,
                title: (v.title ?? v.id) || v.id,
                language: v.language ?? 'Other',
                region: v.region ?? 'Other',
                attitude: v.attitude ?? '',
                gender: normalizeGender(v.gender),
                provider: v.provider,
                preview: undefined,
                avatar: undefined,
                flagEmoji: undefined,
                favorite: false,
            }));

            mapped.sort((a, b) =>
                (a.language + ' ' + (a.title ?? a.id)).localeCompare(b.language + ' ' + (b.title ?? b.id))
            );

            setCatalog(mapped);
        })().catch(() => {});
    }, [isPaid, upperPlan]);

    const onFiles = useCallback(
        async (files: FileList | null) => {
            setError('');
            setProgress(0);
            if (!files || !files.length) return;

            const file = files[0];
            const v = validate(file);
            if (v) {
                setError(v);
                return;
            }

            setBusy(true);
            try {
                const { id } = await uploadDocument(file, (p) => setProgress(p));

                // ✅ store name for redirect title
                setLastDocName(file.name);

                setPendingDocId(id);
                if (isFree) setShowFreeVoice(true);
                else setShowVoice(true);
            } catch (e: any) {
                setError(e?.message || 'Upload failed. Please try again.');
            } finally {
                setBusy(false);
                setProgress(0);
            }
        },
        [isFree]
    );

    return (
        <section>
            <h2 className="text-xl font-semibold">Library</h2>
            <p className="text-white/70 mt-1">Hey! Upload your files here</p>

            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    onFiles(e.dataTransfer.files);
                }}
                className={[
                    'mt-6 rounded-2xl border border-white/10 bg-black/60 p-8 shadow-xl/30',
                    dragOver ? 'ring-2 ring-accent/60' : '',
                ].join(' ')}
            >
                <div className="flex flex-col items-center">
                    <div className="h-14 w-14 rounded-full border border-white/10 bg-white/[0.04] grid place-items-center">
                        <Upload className="h-5 w-5 text-white/80" />
                    </div>

                    <p className="mt-4 text-white/85">Drop files here to upload, or</p>

                    <button
                        onClick={() => inputRef.current?.click()}
                        disabled={busy}
                        className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10 disabled:opacity-50"
                    >
                        <FileUp className="h-4 w-4" />
                        {busy ? 'Uploading…' : 'Browse Files'}
                    </button>

                    <p className="mt-3 text-xs text-white/50">
                        Accepted formats: pdf, doc, docx, txt, epub, rtf, html • Max {MAX_SIZE_MB}MB
                    </p>

                    <input
                        ref={inputRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt,.epub,.rtf,.html,.htm,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/html,application/rtf,application/epub+zip"
                        onChange={(e) => onFiles(e.target.files)}
                    />

                    {busy && progress > 0 && (
                        <div className="mt-4 w-full max-w-lg">
                            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                                <div
                                    className="h-2 rounded-full bg-accent transition-[width] duration-150"
                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                            </div>
                            <div className="mt-1 text-xs text-white/60 text-center">{Math.floor(progress)}%</div>
                        </div>
                    )}

                    {!!error && (
                        <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-6">
                <button
                    onClick={() => setShowText(true)}
                    className="w-full rounded-2xl border border-white/10 p-8 text-center transition bg-white/[0.03] hover:bg-white/[0.06] flex flex-col items-center justify-center"
                >
                    <div className="h-12 w-12 grid place-items-center rounded-lg border border-white/10 bg-white/[0.04] mb-3">
                        <Type className="h-5 w-5 text-white/90" />
                    </div>
                    <div className="font-medium text-white/90 text-lg">Create Text</div>
                    <p className="text-sm text-white/60 mt-1">Write or paste your own text directly here</p>
                </button>
            </div>

            {docId !== null && (
                <div className="mt-8">
                    <AudioStatus
                        docId={docId}
                        onReady={(readyDocId) => {
                            const name = lastDocName ?? `Audio ${readyDocId}`;
                            router.push(`/dashboard/saved-audio/${readyDocId}?name=${encodeURIComponent(name)}`);
                        }}
                    />
                </div>
            )}

            <AddTextModal
                open={showText}
                plan={plan}
                onClose={() => setShowText(false)}
                onSaved={(id) => {
                    setLastDocName(`Text ${id}`);
                    setDocId(id);
                }}
            />

            <VoicePickerModal
                open={showVoice}
                voices={catalog}
                allowPolly={false}
                initialLang={undefined}
                onClose={() => {
                    setShowVoice(false);
                    setPendingDocId(null);
                }}
                onPick={async (v: PaidPickedVoice) => {
                    if (!pendingDocId) return;
                    try {
                        await startAudio(pendingDocId, { voiceId: v.voiceId, engine: 'neural', format: 'mp3' });
                        setDocId(pendingDocId); // start polling → redirects when READY
                    } finally {
                        setShowVoice(false);
                        setPendingDocId(null);
                    }
                }}
            />

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
                        await startAudio(pendingDocId, {
                            voice: picked.voiceId,
                            engine: 'standard',
                            format: 'mp3',
                        });

                        setLastFreeVoice(picked);
                        setDocId(pendingDocId); // start polling → redirects when READY
                    } finally {
                        setShowFreeVoice(false);
                        setPendingDocId(null);
                    }
                }}
            />
        </section>
    );
}
