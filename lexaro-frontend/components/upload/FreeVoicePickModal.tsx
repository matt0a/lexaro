'use client';
import { X, User, UserRound } from 'lucide-react';

export type PickedVoice = { voiceId: string; title: string };

type Props = {
    open: boolean;
    onClose: () => void;
    onPick: (picked: PickedVoice) => void;
    initialVoiceId?: string | null;
};

const FREE_CHOICES = [
    { voiceId: 'Joanna', title: 'Female (Joanna)', Glyph: User },
    { voiceId: 'Matthew', title: 'Male (Matthew)', Glyph: UserRound },
] as const;

export default function FreeVoicePickModal({ open, onClose, onPick, initialVoiceId }: Props) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/70" onClick={onClose} />
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-black shadow-2xl">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                        <h3 className="text-lg font-semibold">Choose a voice</h3>
                        <button onClick={onClose} className="rounded-md p-1 hover:bg-white/5">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="px-5 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {FREE_CHOICES.map(v => {
                            const Glyph = v.Glyph;
                            const isInitial = initialVoiceId && initialVoiceId === v.voiceId;
                            return (
                                <button
                                    key={v.voiceId}
                                    onClick={() => onPick({ voiceId: v.voiceId, title: v.title })}
                                    className={[
                                        'rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left',
                                        'hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                                        isInitial ? 'ring-1 ring-accent/50' : ''
                                    ].join(' ')}
                                >
                                    <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05]">
                      <Glyph className="h-5 w-5 text-white/80" />
                    </span>
                                        <div className="text-white/90 font-medium">{v.title}</div>
                                    </div>
                                    <div className="mt-3 text-xs text-white/60">
                                        Natural US English · No preview on free plan
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div className="px-5 pb-5 space-y-3">
                        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
                            Upgrade to unlock premium voices and styles.
                        </div>
                        <button onClick={onClose} className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
