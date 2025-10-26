'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { uploadDocument, startAudio } from '@/lib/documents';

import VoicePickerModal, {
    type PickedVoice,
    type VoiceMeta,
} from '@/components/voices/VoicePickerModal';

import api from '@/lib/api';

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
    provider: 'speechify' | 'polly';
    language: string | null;
    region: string | null;
    gender: string | null;
    attitude: string | null;
    preview: string | null;
};

export default function AddTextModal({ open, plan, onClose, onSaved }: Props) {
    const [title, setTitle] = useState('');
    const [text, setText] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string>('');

    // PAID voice pick
    const [pendingDocId, setPendingDocId] = useState<number | null>(null);
    const [showVoice, setShowVoice] = useState(false);

    // Catalog for the picker
    const [catalog, setCatalog] = useState<VoiceMeta[]>([]);

    const upperPlan = plan?.toUpperCase?.() || 'FREE';
    const isFree = upperPlan === 'FREE';
    const allowPolly = isFree; // hide Polly for premium tiers

    const normalizeGender = (g?: string | null): VoiceMeta['gender'] => {
        const s = (g ?? '').trim().toLowerCase();
        if (s.startsWith('f')) return 'Female';
        if (s.startsWith('m')) return 'Male';
        return 'Other';
    };

    // 🔑 keep hooks ALWAYS before any early return
    useEffect(() => {
        if (!showVoice) return;
        (async () => {
            try {
                const { data } = await api.get<VoiceDto[]>('/tts/voices', {
                    params: { plan: upperPlan },
                });

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
                    (a.language + ' ' + (a.title ?? a.id)).localeCompare(
                        b.language + ' ' + (b.title ?? b.id)
                    )
                );

                setCatalog(mapped);
            } catch {
                setCatalog([]);
            }
        })();
    }, [showVoice, upperPlan]);

    if (!open) return null; // after hooks are declared above

    const handleSave = async () => {
        setError('');
        if (!text.trim()) {
            setError('Please enter some text.');
            return;
        }

        const nameBase =
            (title || 'Untitled').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').slice(0, 50) || 'Text';
        const filename = `${nameBase}-${Date.now()}.txt`;
        const file = new File([new Blob([text], { type: 'text/plain' })], filename, { type: 'text/plain' });

        setBusy(true);
        try {
            const { id } = await uploadDocument(file);

            if (isFree) {
                await startAudio(id, { voice: 'Joanna', engine: 'standard', format: 'mp3' });
                onSaved(id);
                onClose();
                setTitle('');
                setText('');
            } else {
                setPendingDocId(id);
                setShowVoice(true);
            }
        } catch (e: any) {
            setError(e?.message || 'Failed to save text. Please try again.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70" onClick={onClose} />

            {/* Dialog */}
            <div role="dialog" aria-modal="true" className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-black shadow-2xl">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                        <h3 className="text-lg font-semibold">Add Text</h3>
                        <button onClick={onClose} className="rounded-md p-1 hover:bg-white/5">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-5 py-4 space-y-4">
                        <div>
                            <label className="block text-sm text-white/70 mb-1">Title</label>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Optional"
                                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-accent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-white/70 mb-1">Text</label>
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Type or paste text here"
                                rows={10}
                                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-accent resize-y"
                            />
                        </div>

                        {error && <div className="text-sm text-red-300">{error}</div>}
                    </div>

                    {/* Footer */}
                    <div className="px-5 pb-5">
                        <button onClick={handleSave} disabled={busy} className="w-full btn-accent disabled:opacity-50">
                            {busy ? 'Saving…' : 'Save File'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Voice picker (paid) */}
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
                        await startAudio(pendingDocId, { voiceId: v.voiceId, engine: 'neural', format: 'mp3' });
                        onSaved(pendingDocId);
                        onClose();
                        setTitle('');
                        setText('');
                    } catch (e: any) {
                        setError(e?.message || 'Failed to start audio.');
                    } finally {
                        setShowVoice(false);
                        setPendingDocId(null);
                    }
                }}
            />
        </div>
    );
}
