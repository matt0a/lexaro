'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, FileUp, Type, AlertTriangle } from 'lucide-react';
import AudioStatus from '@/components/dashboard/AudioStatus';
import AddTextModal from '@/components/upload/AddTextModal';
import { uploadDocument, startAudio } from '@/lib/documents';

// ✅ import the picker + its types
import VoicePickerModal, {
    type PickedVoice,
    type VoiceMeta,
} from '@/components/voices/VoicePickerModal';

import api from '@/lib/api';

type Props = { plan: string };

const MAX_SIZE_MB = 50;
const ACCEPTED_EXTS = ['pdf', 'doc', 'docx', 'txt', 'epub', 'rtf', 'html', 'htm'];

/** Backend DTO from GET /tts/voices */
type VoiceDto = {
    name: string;
    gender?: string | null;
    language?: string | null;
    enginesSupported?: string[] | null;
};

export default function UploadSection({ plan }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);

    const [dragOver, setDragOver] = useState(false);
    const [docId, setDocId] = useState<number | null>(null);
    const [busy, setBusy] = useState(false);
    const [progress, setProgress] = useState<number>(0);
    const [error, setError] = useState<string>('');
    const [showText, setShowText] = useState(false);

    // Paid-only: pick voice before starting TTS
    const [pendingDocId, setPendingDocId] = useState<number | null>(null);
    const [showVoice, setShowVoice] = useState(false);

    // Voice catalog for picker
    const [catalog, setCatalog] = useState<VoiceMeta[]>([]);

    const isFree = plan?.toUpperCase() === 'FREE';

    // --- helpers --------------------------------------------------

    const normalizeGender = (g?: string | null): VoiceMeta['gender'] => {
        const s = (g ?? '').trim().toLowerCase();
        if (s === 'male') return 'Male';
        if (s === 'female') return 'Female';
        return 'Other'; // or `undefined` if you prefer to hide gender when unknown
    };

    const validate = (file: File): string | null => {
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > MAX_SIZE_MB) return `File is too large (${sizeMB.toFixed(1)} MB). Max is ${MAX_SIZE_MB} MB.`;
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        if (!ACCEPTED_EXTS.includes(ext)) return `Unsupported file type ".${ext}". Try: ${ACCEPTED_EXTS.join(', ')}`;
        return null;
    };

    // --- effects --------------------------------------------------

    // Load voices once for paid users
    useEffect(() => {
        if (isFree) return;

        (async () => {
            const { data } = await api.get<VoiceDto[]>('/tts/voices');
            const list = Array.isArray(data) ? data : [];

            const mapped: VoiceMeta[] = list.map((v) => ({
                id: v.name,                     // unique id (maps to provider voice id)
                title: v.name,                  // required by VoiceMeta
                language: v.language ?? 'Unknown',
                region: '',                     // fill when backend exposes region/dialect
                attitude: '',                   // fill (e.g., style/tone) if available
                gender: normalizeGender(v.gender),
                preview: undefined,             // supply preview url if you have one
                avatar: undefined,
                flagEmoji: undefined,
                favorite: false,
            }));

            // Optional: sort for nicer display (by language/title)
            mapped.sort((a, b) => (a.language + a.title).localeCompare(b.language + b.title));

            setCatalog(mapped);
        })().catch(() => {
            // silent fail — picker will show but be empty; you might want to surface a toast
        });
    }, [isFree]);

    // --- handlers -------------------------------------------------

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
                // presign → upload → complete (with optional progress callback)
                const { id } = await uploadDocument(file, (p) => setProgress(p));

                if (isFree) {
                    // FREE: Polly standard default
                    await startAudio(id, { voice: 'Joanna', engine: 'standard', format: 'mp3' });
                    setDocId(id);
                } else {
                    // PAID: force Speechify voice choice BEFORE starting
                    setPendingDocId(id);
                    setShowVoice(true);
                }
            } catch (e: any) {
                setError(e?.message || 'Upload failed. Please try again.');
            } finally {
                setBusy(false);
                setProgress(0);
            }
        },
        [isFree]
    );

    // --- render ---------------------------------------------------

    return (
        <section>
            <h2 className="text-xl font-semibold">Library</h2>
            <p className="text-white/70 mt-1">Hey, upload your first file</p>

            {/* Upload card */}
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

                    {/* Progress */}
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

                    {/* Error */}
                    {!!error && (
                        <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Full-width “Create Text” */}
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

            {/* Live job status */}
            {docId !== null && (
                <div className="mt-8">
                    <AudioStatus docId={docId} />
                </div>
            )}

            {/* Add Text modal */}
            <AddTextModal
                open={showText}
                plan={plan}
                onClose={() => setShowText(false)}
                onSaved={(id) => setDocId(id)}
            />

            {/* Voice picker (paid) */}
            <VoicePickerModal
                open={showVoice}
                voices={catalog}
                onClose={() => {
                    setShowVoice(false); // user can start later from library
                    setPendingDocId(null);
                }}
                onPick={async (v: PickedVoice) => {
                    if (!pendingDocId) return;
                    try {
                        // Paid: send Speechify voice id (no Polly)
                        await startAudio(pendingDocId, { voiceId: v.voiceId, engine: 'neural', format: 'mp3' });
                        setDocId(pendingDocId);
                    } finally {
                        setShowVoice(false);
                        setPendingDocId(null);
                    }
                }}
            />
        </section>
    );
}
