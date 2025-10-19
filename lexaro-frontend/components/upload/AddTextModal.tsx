'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { uploadDocument, startAudio } from '@/lib/documents';

// ✅ use the new picker and import types correctly
import VoicePickerModal, {
    type PickedVoice,
} from '@/components/voices/VoicePickerModal';

type Props = {
    open: boolean;
    plan: string;
    onClose: () => void;
    onSaved: (docId: number) => void; // return the new document id
};

export default function AddTextModal({ open, plan, onClose, onSaved }: Props) {
    const [title, setTitle] = useState('');
    const [text, setText] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string>('');

    // PAID voice pick
    const [pendingDocId, setPendingDocId] = useState<number | null>(null);
    const [showVoice, setShowVoice] = useState(false);

    if (!open) return null;
    const isFree = plan?.toUpperCase() === 'FREE';

    const handleSave = async () => {
        setError('');
        if (!text.trim()) {
            setError('Please enter some text.');
            return;
        }

        // build a .txt file
        const nameBase =
            (title || 'Untitled').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').slice(0, 50) || 'Text';
        const filename = `${nameBase}-${Date.now()}.txt`;
        const file = new File([new Blob([text], { type: 'text/plain' })], filename, { type: 'text/plain' });

        setBusy(true);
        try {
            // presign → upload → complete
            const { id } = await uploadDocument(file);

            if (isFree) {
                // FREE: safe default (Polly std)
                await startAudio(id, { voice: 'Joanna', engine: 'standard', format: 'mp3' });
                onSaved(id);
                onClose();
                setTitle('');
                setText('');
            } else {
                // PAID: force Speechify voice pick before starting
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

            {/* PAID: Voice picker */}
            <VoicePickerModal
                open={showVoice}
                onClose={() => {
                    setShowVoice(false); // user can start later from library
                    setPendingDocId(null);
                }}
                onPick={async (v: PickedVoice) => {
                    if (!pendingDocId) return;
                    try {
                        // Speechify path: send voice_id
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
