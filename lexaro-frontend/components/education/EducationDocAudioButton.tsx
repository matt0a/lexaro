'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Volume2 } from 'lucide-react';

import api from '@/lib/api';
import { startAudio } from '@/lib/documents';

import AudioStatus from '@/components/dashboard/AudioStatus';
import VoicePickerModal, { type VoiceMeta, type PickedVoice } from '@/components/voices/VoicePickerModal';
import FreeVoicePickModal from '@/components/upload/FreeVoicePickModal';

type MeUsage = { plan: string };

type VoiceDto = {
    id: string;
    title: string | null;
    provider: 'speechify' | 'polly';
    language: string | null;
    region: string | null;
    gender: string | null;
    attitude: string | null;
    preview: string | null;
    avatar: string | null;
    favorite: boolean;
};

type SimplePickedVoice = { voiceId: string; title: string };

function formatPlan(p?: string) {
    if (!p) return 'FREE';
    return p.toUpperCase();
}

export default function EducationDocAudioButton({
                                                    docId,
                                                    docName,
                                                }: {
    docId: number;
    docName?: string | null;
}) {
    const router = useRouter();

    const [planRaw, setPlanRaw] = useState('FREE');

    const [showPaidPicker, setShowPaidPicker] = useState(false);
    const [showFreePicker, setShowFreePicker] = useState(false);

    const [catalog, setCatalog] = useState<VoiceMeta[]>([]);
    const [loadingVoices, setLoadingVoices] = useState(false);

    const [jobActive, setJobActive] = useState(false);
    const [lastFreeVoice, setLastFreeVoice] = useState<SimplePickedVoice | null>(null);

    const isFree = useMemo(() => formatPlan(planRaw) === 'FREE', [planRaw]);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get<MeUsage>('/me/usage');
                setPlanRaw(data.plan ?? 'FREE');
            } catch {
                setPlanRaw('FREE');
            }
        })();
    }, []);

    useEffect(() => {
        if (!showPaidPicker) return;

        (async () => {
            setLoadingVoices(true);
            try {
                const { data } = await api.get<VoiceDto[]>('/tts/voices');

                const mapped: VoiceMeta[] = (data ?? []).map((v) => ({
                    id: v.id,
                    title: (v.title ?? v.id) || v.id,
                    provider: v.provider,
                    language: (v.language ?? 'Unknown').trim() || 'Unknown',
                    region: (v.region ?? '').toUpperCase(),
                    gender:
                        (v.gender ?? '').toLowerCase().startsWith('f')
                            ? 'Female'
                            : (v.gender ?? '').toLowerCase().startsWith('m')
                                ? 'Male'
                                : 'Other',
                    attitude: v.attitude ?? '',
                    preview: v.preview ?? undefined,
                    avatar: v.avatar ?? undefined,
                    flagEmoji: undefined,
                    favorite: v.favorite ?? false,
                }));

                setCatalog(mapped);
            } catch {
                setCatalog([]);
            } finally {
                setLoadingVoices(false);
            }
        })();
    }, [showPaidPicker]);

    // ✅ FIX: PickedVoice has voiceId, not id
    async function startWithPaidVoice(picked: PickedVoice) {
        await startAudio(docId, {
            voiceId: picked.voiceId, // ✅ correct
            engine: 'neural',
            format: 'mp3',
        });

        setJobActive(true);
        setShowPaidPicker(false);
    }

    async function startWithFreeVoice(picked: SimplePickedVoice) {
        await startAudio(docId, {
            voice: picked.voiceId,
            engine: 'standard',
            format: 'mp3',
        });

        setLastFreeVoice(picked);
        setJobActive(true);
        setShowFreePicker(false);
    }

    function openPicker() {
        if (isFree) setShowFreePicker(true);
        else setShowPaidPicker(true);
    }

    return (
        <div className="flex flex-col items-end gap-3">
            <button
                type="button"
                onClick={openPicker}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 transition"
            >
                <Volume2 className="h-4 w-4" />
                Audio
            </button>

            {jobActive ? (
                <div className="w-full max-w-md">
                    <AudioStatus
                        docId={docId}
                        onReady={(id) => {
                            const name = encodeURIComponent(docName || `Document ${id}`);
                            router.push(`/dashboard/saved-audio/${id}?name=${name}`);
                        }}
                    />
                </div>
            ) : null}

            <VoicePickerModal
                open={showPaidPicker}
                onClose={() => setShowPaidPicker(false)}
                onPick={startWithPaidVoice}
                voices={catalog}
                initialLang={undefined}
                allowPolly={true}
                onExplore={undefined}
                onToggleFavorite={async (voice: VoiceMeta) => {
                    try {
                        if (voice.favorite) {
                            await api.delete(`/tts/voices/${encodeURIComponent(voice.id)}/favorite`, {
                                params: { provider: voice.provider }
                            });
                        } else {
                            await api.post(`/tts/voices/${encodeURIComponent(voice.id)}/favorite`, null, {
                                params: { provider: voice.provider }
                            });
                        }
                        setCatalog(prev => prev.map(v =>
                            v.id === voice.id && v.provider === voice.provider
                                ? { ...v, favorite: !v.favorite }
                                : v
                        ));
                    } catch (err) {
                        console.error('Failed to toggle favorite:', err);
                    }
                }}
            />

            <FreeVoicePickModal
                open={showFreePicker}
                initialVoiceId={lastFreeVoice?.voiceId ?? null}
                onClose={() => setShowFreePicker(false)}
                onUpgrade={() => router.push('/upgrade')}
                onPick={startWithFreeVoice}
            />

            {loadingVoices && showPaidPicker ? (
                <div className="text-xs text-white/60">Loading voices…</div>
            ) : null}
        </div>
    );
}
