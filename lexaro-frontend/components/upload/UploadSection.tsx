"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    Upload,
    FileUp,
    Type,
    AlertTriangle,
    Sparkles,
    FileText,
    Clock,
    Headphones,
    ArrowRight,
    ChevronRight,
    Mic2,
    FileAudio2,
    Zap,
    Gauge,
} from "lucide-react";
import AudioStatus from "@/components/dashboard/AudioStatus";
import AddTextModal from "@/components/upload/AddTextModal";
import { uploadDocument, startAudio } from "@/lib/documents";

import VoicePickerModal, {
    type PickedVoice as PaidPickedVoice,
    type VoiceMeta,
} from "@/components/voices/VoicePickerModal";

import FreeVoicePickModal from "@/components/upload/FreeVoicePickModal";
import api from "@/lib/api";

type Props = {
    plan: string;
    initialOpenUpload?: boolean;
};

const MAX_SIZE_MB = 50;
const ACCEPTED_EXTS = ["pdf", "doc", "docx", "txt", "epub", "rtf", "html", "htm"];

type VoiceDto = {
    id: string;
    title: string | null;
    provider: "speechify" | "polly";
    language: string | null;
    region: string | null;
    gender: string | null;
    attitude: string | null;
    preview: string | null;
    avatar: string | null;
    favorite: boolean;
};

type SimplePickedVoice = { voiceId: string; title: string };

type PageResp<T> = {
    content: T[];
    totalElements: number;
    totalPages: number;
};

type DocumentResponse = {
    id: number;
    filename: string;
    mime: string;
    sizeBytes: number;
    uploadedAt: string;
};

type UsageDto = {
    plan: string;
    unlimited: boolean;
    monthlyUsed: number;
    monthlyRemaining: number;
    dailyUsed: number;
    dailyRemaining: number;
};

/**
 * Format bytes to human readable string.
 */
function fmtBytes(b: number) {
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
    if (b < 1024 * 1024 * 1024) return (b / 1024 / 1024).toFixed(1) + ' MB';
    return (b / 1024 / 1024 / 1024).toFixed(1) + ' GB';
}

/**
 * Format time ago from date.
 */
function timeAgo(date: Date) {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
}

/**
 * UploadSection Component
 *
 * Main upload interface for Voice Library with:
 * - Drag and drop file upload
 * - Create text modal
 * - Voice picker integration
 * - Recent documents display
 * - Usage stats
 */
export default function UploadSection({ plan, initialOpenUpload = false }: Props) {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    const [dragOver, setDragOver] = useState(false);
    const [docId, setDocId] = useState<number | null>(null);
    const [busy, setBusy] = useState(false);
    const [progress, setProgress] = useState<number>(0);
    const [error, setError] = useState<string>("");
    const [showText, setShowText] = useState<boolean>(initialOpenUpload);

    const [lastDocName, setLastDocName] = useState<string | null>(null);

    const [pendingDocId, setPendingDocId] = useState<number | null>(null);

    const [showVoice, setShowVoice] = useState(false);
    const [showFreeVoice, setShowFreeVoice] = useState(false);
    const [lastFreeVoice, setLastFreeVoice] = useState<SimplePickedVoice | null>(null);

    const [catalog, setCatalog] = useState<VoiceMeta[]>([]);

    // Recent documents
    const [recentDocs, setRecentDocs] = useState<DocumentResponse[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(true);

    // Usage stats
    const [usage, setUsage] = useState<UsageDto | null>(null);

    const upperPlan = plan?.toUpperCase?.() || "FREE";
    const isFree = upperPlan === "FREE";
    const isPaid = !isFree;

    useEffect(() => {
        if (initialOpenUpload) setShowText(true);
    }, [initialOpenUpload]);

    // Load recent documents and usage
    useEffect(() => {
        const loadData = async () => {
            try {
                const [docsRes, usageRes] = await Promise.all([
                    api.get<PageResp<DocumentResponse>>('/documents', {
                        params: { page: 0, size: 6, sort: 'uploadedAt,DESC', purpose: 'AUDIO' },
                    }),
                    api.get<UsageDto>('/me/usage'),
                ]);
                setRecentDocs(docsRes.data.content || []);
                setUsage(usageRes.data);
            } catch (err) {
                console.error('Failed to load data:', err);
            } finally {
                setLoadingDocs(false);
            }
        };
        loadData();
    }, [docId]); // Reload when a new doc is created

    // ---------------------------
    // Voice curation (same behavior as AddTextModal)
    // ---------------------------

    const KNOWN_LANGS = ["Spanish", "French", "German", "Portuguese"] as const;

    const MUST_HAVE_ENGLISH = ["kristy", "june", "mason"] as const;

    const POPULAR_ENGLISH_ORDER = [
        "kristy", "june", "mason", "gwyneth", "snoop", "mrbeast", "cliff",
        "cliff weitzman", "nate", "ali", "ali abdaal", "henry", "emma",
        "oliver", "jamie", "mary", "lisa", "george", "jessica", "simon",
        "sally", "aria",
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

        if (lower.includes("english")) return "English";
        if (lower.includes("spanish")) return "Spanish";
        if (lower.includes("french")) return "French";
        if (lower.includes("portuguese")) return "Portuguese";
        if (lower.includes("german")) return "German";

        return s;
    }

    const normalizeGender = (g?: string | null): VoiceMeta["gender"] => {
        const s = (g ?? "").trim().toLowerCase();
        if (s.startsWith("f")) return "Female";
        if (s.startsWith("m")) return "Male";
        return "Other";
    };

    function keyify(s: string) {
        return s.toLowerCase().replace(/[^a-z0-9]+/g, "");
    }

    function stableVoiceSort(a: VoiceMeta, b: VoiceMeta) {
        const ap = a.preview ? 1 : 0;
        const bp = b.preview ? 1 : 0;
        if (ap !== bp) return bp - ap;

        const aProv = a.provider === "speechify" ? 0 : 1;
        const bProv = b.provider === "speechify" ? 0 : 1;
        if (aProv !== bProv) return aProv - bProv;

        return (a.title ?? a.id).localeCompare(b.title ?? b.id);
    }

    function pickByGender(list: VoiceMeta[], total: number) {
        const females = list.filter((v) => v.gender === "Female").sort(stableVoiceSort);
        const males = list.filter((v) => v.gender === "Male").sort(stableVoiceSort);
        const others = list
            .filter((v) => v.gender !== "Female" && v.gender !== "Male")
            .sort(stableVoiceSort);

        const wantFemale = Math.floor(total / 2);
        const wantMale = total - wantFemale;

        const picked: VoiceMeta[] = [];
        picked.push(...females.slice(0, wantFemale));
        picked.push(...males.slice(0, wantMale));

        if (picked.length < total) {
            const used = new Set(picked.map((p) => p.id));
            const pool = [...females, ...males, ...others].filter((v) => !used.has(v.id));
            picked.push(...pool.slice(0, total - picked.length));
        }

        return picked.slice(0, total).sort(stableVoiceSort);
    }

    function pickByNameOrder(
        src: VoiceMeta[],
        nameOrder: readonly string[],
        count: number,
        forceNames?: readonly string[]
    ) {
        const byKey = new Map<string, VoiceMeta[]>();

        for (const v of src) {
            const keys = new Set<string>();
            keys.add(keyify(v.id));
            if (v.title) keys.add(keyify(v.title));
            for (const k of keys) {
                const arr = byKey.get(k) ?? [];
                arr.push(v);
                byKey.set(k, arr);
            }
        }

        const picked: VoiceMeta[] = [];
        const used = new Set<string>();

        if (forceNames?.length) {
            for (const n of forceNames) {
                const candidates = byKey.get(keyify(n)) ?? [];
                const best = candidates.sort(stableVoiceSort)[0];
                if (best && !used.has(best.id)) {
                    picked.push(best);
                    used.add(best.id);
                }
            }
        }

        for (const n of nameOrder) {
            if (picked.length >= count) break;
            const candidates = byKey.get(keyify(n)) ?? [];
            const best = candidates.sort(stableVoiceSort)[0];
            if (best && !used.has(best.id)) {
                picked.push(best);
                used.add(best.id);
            }
        }

        if (picked.length < count) {
            const rest = src.filter((v) => !used.has(v.id)).sort(stableVoiceSort);
            for (const v of rest) {
                if (picked.length >= count) break;
                picked.push(v);
                used.add(v.id);
            }
        }

        return picked.slice(0, count);
    }

    function pickEnglish30(all: VoiceMeta[]) {
        const english = all.filter((v) => v.language === "English");
        const us = english.filter((v) => (v.region ?? "").toUpperCase() === "US");
        const nonUs = english.filter((v) => (v.region ?? "").toUpperCase() !== "US");

        const us15 = pickByNameOrder(us, POPULAR_ENGLISH_ORDER, 15, MUST_HAVE_ENGLISH);

        const buckets = new Map<string, VoiceMeta[]>();
        for (const v of nonUs) {
            const r = (v.region ?? "OTHER").toUpperCase();
            const arr = buckets.get(r) ?? [];
            arr.push(v);
            buckets.set(r, arr);
        }
        for (const arr of buckets.values()) arr.sort(stableVoiceSort);

        const preferredRegions = ["GB", "UK", "AU", "CA", "IN", "IE", "NZ", "ZA", "SG", "PH", "NG", "KE"];
        const regionOrder = [
            ...preferredRegions.filter((r) => buckets.has(r)),
            ...Array.from(buckets.keys()).filter((r) => !preferredRegions.includes(r)),
        ];

        const nonUsPicked: VoiceMeta[] = [];
        const usedNonUs = new Set<string>();

        while (nonUsPicked.length < 15) {
            let progressed = false;
            for (const r of regionOrder) {
                const arr = buckets.get(r);
                if (!arr || arr.length === 0) continue;
                const next = arr.shift()!;
                if (usedNonUs.has(next.id)) continue;
                nonUsPicked.push(next);
                usedNonUs.add(next.id);
                progressed = true;
                if (nonUsPicked.length >= 15) break;
            }
            if (!progressed) break;
        }

        if (nonUsPicked.length < 15) {
            const rest = nonUs.filter((v) => !usedNonUs.has(v.id)).sort(stableVoiceSort);
            nonUsPicked.push(...rest.slice(0, 15 - nonUsPicked.length));
        }

        const seen = new Set<string>();
        const out: VoiceMeta[] = [];
        for (const v of [...us15, ...nonUsPicked]) {
            if (seen.has(v.id)) continue;
            seen.add(v.id);
            out.push(v);
        }
        return out.slice(0, 30);
    }

    function curateVoices(all: VoiceMeta[]) {
        const byLang = new Map<string, VoiceMeta[]>();
        for (const v of all) {
            const lang = v.language ?? "Other";
            const arr = byLang.get(lang) ?? [];
            arr.push(v);
            byLang.set(lang, arr);
        }

        const result: VoiceMeta[] = [];

        result.push(...pickEnglish30(all));

        for (const lang of KNOWN_LANGS) {
            const list = (byLang.get(lang) ?? []).sort(stableVoiceSort);
            result.push(...pickByGender(list, 10));
        }

        const skip = new Set<string>(["English", ...KNOWN_LANGS]);
        const othersLangs = Array.from(byLang.keys())
            .filter((l) => !skip.has(l))
            .sort((a, b) => a.localeCompare(b));

        for (const lang of othersLangs) {
            const list = (byLang.get(lang) ?? []).sort(stableVoiceSort);
            result.push(...pickByGender(list, 6));
        }

        const seen = new Set<string>();
        const deduped: VoiceMeta[] = [];
        for (const v of result) {
            if (seen.has(v.id)) continue;
            seen.add(v.id);
            deduped.push(v);
        }

        return deduped;
    }

    // Load catalog ONLY when paid picker opens
    useEffect(() => {
        if (!showVoice) return;
        if (!isPaid) return;

        (async () => {
            try {
                const { data } = await api.get<VoiceDto[]>("/tts/voices", { params: { plan: upperPlan } });
                const list = Array.isArray(data) ? data : [];

                const mapped: VoiceMeta[] = list.map((v) => ({
                    id: v.id,
                    title: (v.title ?? v.id) || v.id,
                    language: normalizeLang(v.language),
                    region: (v.region ?? "").toUpperCase() || "OTHER",
                    attitude: v.attitude ?? "",
                    gender: normalizeGender(v.gender),
                    provider: v.provider,
                    preview: v.preview ?? undefined,
                    avatar: v.avatar ?? undefined,
                    flagEmoji: undefined,
                    favorite: v.favorite ?? false,
                }));

                setCatalog(curateVoices(mapped));
            } catch {
                setCatalog([]);
            }
        })();
    }, [showVoice, isPaid, upperPlan]);

    // ---------------------------
    // Upload handling
    // ---------------------------

    const validate = (file: File): string | null => {
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > MAX_SIZE_MB) return `File is too large (${sizeMB.toFixed(1)} MB). Max is ${MAX_SIZE_MB} MB.`;
        const ext = file.name.split(".").pop()?.toLowerCase() || "";
        if (!ACCEPTED_EXTS.includes(ext)) return `Unsupported file type ".${ext}". Try: ${ACCEPTED_EXTS.join(", ")}`;
        return null;
    };

    const onFiles = useCallback(
        async (files: FileList | null) => {
            setError("");
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
                const { id } = await uploadDocument(file, (p) => setProgress(p), 'AUDIO');

                setLastDocName(file.name);
                setPendingDocId(id);

                if (isFree) {
                    setShowFreeVoice(true);
                } else {
                    setShowVoice(true);
                }
            } catch (e: any) {
                setError(e?.message || "Upload failed. Please try again.");
            } finally {
                setBusy(false);
                setProgress(0);
            }
        },
        [isFree]
    );

    return (
        <section className="relative">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
            >
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 grid place-items-center shadow-lg shadow-amber-500/20">
                        <Mic2 className="h-7 w-7 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold">Voice Library</h1>
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                                {upperPlan === 'FREE' ? 'Free' : upperPlan.includes('PLUS') ? 'Premium+' : 'Premium'}
                            </span>
                        </div>
                        <p className="text-white/60 text-sm mt-1">
                            Convert documents to natural-sounding audio
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowText(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10
                                   hover:bg-white/10 transition-colors"
                        type="button"
                    >
                        <Type className="h-4 w-4" />
                        Create Text
                    </button>
                    <Link
                        href="/saved-audio"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10
                                   hover:bg-white/10 transition-colors"
                    >
                        <Headphones className="h-4 w-4" />
                        Saved Audio
                    </Link>
                </div>
            </motion.div>

            {/* Stats Row */}
            {usage && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.05 }}
                    className="grid grid-cols-3 gap-4 mb-6"
                >
                    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                <Zap className="h-5 w-5 text-amber-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">
                                    {usage.unlimited ? '∞' : usage.monthlyRemaining.toLocaleString()}
                                </div>
                                <div className="text-xs text-white/50">Chars Left</div>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                <FileAudio2 className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{recentDocs.length}</div>
                                <div className="text-xs text-white/50">Recent Files</div>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                                <Gauge className="h-5 w-5 text-green-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">
                                    {usage.unlimited ? '∞' : (usage.monthlyUsed + usage.monthlyRemaining).toLocaleString()}
                                </div>
                                <div className="text-xs text-white/50">Monthly Cap</div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Upload Panel */}
            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 }}
                className={[
                    "rounded-2xl bg-white/5 border border-white/10 p-6 md:p-8",
                    dragOver ? "ring-2 ring-amber-500/50 border-amber-500/50" : "hover:border-white/20",
                    "transition-all",
                ].join(" ")}
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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                                <Upload className="h-6 w-6 text-amber-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">Upload Document</h3>
                                <p className="text-sm text-white/60">Drop a file or click to browse</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-4">
                            {['PDF', 'DOCX', 'TXT', 'EPUB', 'RTF', 'HTML'].map((fmt) => (
                                <span key={fmt} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white/60">
                                    {fmt}
                                </span>
                            ))}
                            <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-medium">
                                Max {MAX_SIZE_MB}MB
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() => inputRef.current?.click()}
                        disabled={busy}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500
                                   text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40
                                   disabled:opacity-50 transition-all"
                        type="button"
                    >
                        <FileUp className="h-5 w-5" />
                        {busy ? "Uploading…" : "Browse Files"}
                    </button>
                </div>

                {/* Drop Zone */}
                <div className={`mt-6 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                    dragOver ? 'border-amber-500 bg-amber-500/10' : 'border-white/10 bg-white/[0.02]'
                }`}>
                    <Upload className={`h-8 w-8 mx-auto mb-3 ${dragOver ? 'text-amber-400' : 'text-white/40'}`} />
                    <p className={dragOver ? 'text-amber-400' : 'text-white/60'}>
                        {dragOver ? 'Drop to upload' : 'Drag and drop files here'}
                    </p>
                </div>

                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.epub,.rtf,.html,.htm,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/html,application/rtf,application/epub+zip"
                    onChange={(e) => onFiles(e.target.files)}
                />

                {/* Progress Bar */}
                {busy && progress > 0 && (
                    <div className="mt-6">
                        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                            <div
                                className="h-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-[width] duration-150"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                        </div>
                        <div className="mt-2 text-xs text-white/60 text-center">{Math.floor(progress)}%</div>
                    </div>
                )}

                {/* Error */}
                {!!error && (
                    <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{error}</span>
                    </div>
                )}
            </motion.div>

            {/* Create Text Card */}
            <motion.button
                type="button"
                onClick={() => setShowText(true)}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.15 }}
                className="mt-4 w-full rounded-2xl bg-white/5 border border-white/10 p-5
                           hover:bg-white/[0.08] hover:border-amber-500/30 transition-all text-left group"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                            <Type className="h-6 w-6 text-purple-400" />
                        </div>
                        <div>
                            <div className="font-semibold text-white group-hover:text-amber-400 transition-colors">
                                Create from Text
                            </div>
                            <p className="text-sm text-white/60">
                                Write or paste text directly and generate audio
                            </p>
                        </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-white/30 group-hover:text-amber-400 transition-colors" />
                </div>
            </motion.button>

            {/* Audio Processing Status - Above Recent Documents */}
            {docId !== null && (
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.18 }}
                    className="mt-6"
                >
                    <AudioStatus
                        docId={docId}
                        docName={lastDocName ?? undefined}
                        onReady={(readyDocId) => {
                            const name = lastDocName ?? `Audio ${readyDocId}`;
                            router.push(`/dashboard/saved-audio/${readyDocId}?name=${encodeURIComponent(name)}`);
                        }}
                    />
                </motion.div>
            )}

            {/* Recent Documents */}
            {recentDocs.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.2 }}
                    className="mt-8"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Clock className="h-5 w-5 text-white/40" />
                            Recent Uploads
                        </h2>
                        <Link
                            href="/saved-audio"
                            className="text-sm text-amber-400 hover:underline flex items-center gap-1"
                        >
                            View all <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {recentDocs.map((doc) => {
                            const uploadDate = new Date(doc.uploadedAt);
                            return (
                                <Link
                                    key={doc.id}
                                    href={`/dashboard/saved-audio/${doc.id}?name=${encodeURIComponent(doc.filename)}`}
                                    className="group flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-4
                                               hover:bg-white/[0.08] hover:border-amber-500/30 transition-all"
                                >
                                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                                        <FileAudio2 className="h-5 w-5 text-cyan-400" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-medium text-sm truncate group-hover:text-amber-400 transition-colors">
                                            {doc.filename.replace(/\.[^.]+$/, '.mp3')}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-white/50 mt-0.5">
                                            <span>{fmtBytes(doc.sizeBytes)}</span>
                                            <span>•</span>
                                            <span>{timeAgo(uploadDate)}</span>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-white/30 group-hover:text-amber-400 transition-colors" />
                                </Link>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* Loading Recent */}
            {loadingDocs && (
                <div className="mt-8 flex items-center justify-center py-8">
                    <div className="flex items-center gap-3 text-white/60">
                        <div className="h-5 w-5 border-2 border-white/20 border-t-amber-500 rounded-full animate-spin" />
                        Loading recent uploads...
                    </div>
                </div>
            )}

            {/* Modals */}
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
                        await startAudio(pendingDocId, { voiceId: v.voiceId, engine: "neural", format: "mp3" });
                        setDocId(pendingDocId);
                    } finally {
                        setShowVoice(false);
                        setPendingDocId(null);
                    }
                }}
                onToggleFavorite={async (voice: VoiceMeta) => {
                    try {
                        if (voice.favorite) {
                            // Remove from favorites
                            await api.delete(`/tts/voices/${encodeURIComponent(voice.id)}/favorite`, {
                                params: { provider: voice.provider }
                            });
                        } else {
                            // Add to favorites
                            await api.post(`/tts/voices/${encodeURIComponent(voice.id)}/favorite`, null, {
                                params: { provider: voice.provider }
                            });
                        }
                        // Update local catalog state
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
                            engine: "standard",
                            format: "mp3",
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
