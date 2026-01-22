'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Upload, FileUp, Type, AlertTriangle, Sparkles } from 'lucide-react';
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
        <section className="relative">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="h-9 w-9 rounded-2xl border border-white/10 bg-white/5 grid place-items-center">
                                <Sparkles className="h-4 w-4 text-white/80" />
                            </div>
                            <h2 className="text-2xl font-semibold">Library</h2>
                        </div>
                        <p className="text-white/65 mt-2">Upload documents or create text, then generate audio with your voice.</p>
                        <div className="section-rule" />
                    </div>

                    <button
                        onClick={() => setShowText(true)}
                        className="btn-ghost border border-white/10 bg-white/5 hover:bg-white/10 rounded-2xl px-4 py-2"
                        type="button"
                    >
                        <Type className="h-4 w-4" />
                        Create text
                    </button>
                </div>
            </motion.div>

            {/* Upload Panel */}
            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 }}
                className={[
                    'mt-6 panel-auth panel-auth-hover relative overflow-hidden p-7 md:p-8',
                    dragOver ? 'ring-2 ring-[rgba(34,140,219,.35)]' : '',
                ].join(' ')}
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
            >
                <div className="panel-sheen" />

                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-2xl border border-white/10 bg-white/5 grid place-items-center">
                                <Upload className="h-4 w-4 text-white/85" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-lg font-semibold">Upload</h3>
                                <p className="text-sm text-white/60 mt-1">Drop a file here or browse to upload.</p>
                            </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                            <span className="chip">PDF</span>
                            <span className="chip">DOCX</span>
                            <span className="chip">TXT</span>
                            <span className="chip">EPUB</span>
                            <span className="chip">RTF</span>
                            <span className="chip">HTML</span>
                            <span className="chip-accent">Max {MAX_SIZE_MB}MB</span>
                        </div>
                    </div>

                    <button
                        onClick={() => inputRef.current?.click()}
                        disabled={busy}
                        className="btn-primary-pop rounded-2xl px-5 py-2.5"
                        type="button"
                    >
                        <FileUp className="h-4 w-4" />
                        {busy ? 'Uploading…' : 'Browse Files'}
                    </button>
                </div>

                <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-10 text-center">
                    <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-white/5 border border-white/10 grid place-items-center">
                        <Upload className="h-5 w-5 text-white/75" />
                    </div>
                    <p className="text-white/85">Drop files here to upload</p>
                    <p className="text-xs text-white/55 mt-1">
                        Accepted: {ACCEPTED_EXTS.join(', ')} • Max {MAX_SIZE_MB}MB
                    </p>
                </div>

                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.epub,.rtf,.html,.htm,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/html,application/rtf,application/epub+zip"
                    onChange={(e) => onFiles(e.target.files)}
                />

                {busy && progress > 0 && (
                    <div className="mt-5 w-full max-w-lg">
                        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                            <div
                                className="h-2 rounded-full bg-[var(--accent)] transition-[width] duration-150"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                        </div>
                        <div className="mt-1 text-xs text-white/60 text-center">{Math.floor(progress)}%</div>
                    </div>
                )}

                {!!error && (
                    <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{error}</span>
                    </div>
                )}
            </motion.div>

            {/* Create Text Panel */}
            <motion.button
                type="button"
                onClick={() => setShowText(true)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.99 }}
                className="mt-5 w-full panel-auth panel-auth-hover relative overflow-hidden p-7 md:p-8 text-left"
            >
                <div className="panel-sheen" />

                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-11 w-11 grid place-items-center rounded-2xl border border-white/10 bg-white/5">
                            <Type className="h-5 w-5 text-white/85" />
                        </div>
                        <div>
                            <div className="font-semibold text-white/90 text-lg">Create Text</div>
                            <p className="text-sm text-white/60 mt-1">Write or paste text directly and generate audio.</p>
                        </div>
                    </div>

                    <span className="chip-accent">Open editor</span>
                </div>
            </motion.button>

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
                        setDocId(pendingDocId);
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
                        setDocId(pendingDocId);
                    } finally {
                        setShowFreeVoice(false);
                        setPendingDocId(null);
                    }
                }}
            />
        </section>
    );
}
