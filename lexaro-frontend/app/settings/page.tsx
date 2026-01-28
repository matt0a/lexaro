'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Settings,
    User,
    CreditCard,
    Mic,
    BookOpen,
    Shield,
    Bell,
    Eye,
    EyeOff,
    LogOut,
    ArrowRight,
    ExternalLink,
    ChevronRight,
    Gauge,
    Download,
    Trash2,
    Check,
    Volume2,
    Zap,
    FileText,
    Layers,
    HelpCircle,
    ArrowLeft,
} from 'lucide-react';
import api from '@/lib/api';
import { listVoices, Voice } from '@/lib/voices';

/**
 * Usage data from the API.
 */
type Usage = {
    plan: string;
    unlimited: boolean;
    verified: boolean;
    monthlyCap: number;
    monthlyUsed: number;
    monthlyRemaining: number;
    dailyCap: number;
    dailyUsed: number;
    dailyRemaining: number;
};

/**
 * User preferences stored in localStorage.
 */
type UserPreferences = {
    defaultVoice: string;
    playbackSpeed: number;
    quizDifficulty: 'easy' | 'medium' | 'hard';
    defaultNoteStyle: 'outline' | 'cornell' | 'detailed' | 'summary';
    emailNotifications: boolean;
};

/**
 * Default preferences.
 */
const DEFAULT_PREFERENCES: UserPreferences = {
    defaultVoice: '',
    playbackSpeed: 1.0,
    quizDifficulty: 'medium',
    defaultNoteStyle: 'outline',
    emailNotifications: true,
};

/**
 * Decode base64url string.
 */
function b64urlDecode(str: string) {
    try {
        const pad = str.length % 4 === 2 ? '==' : str.length % 4 === 3 ? '=' : '';
        const s = str.replace(/-/g, '+').replace(/_/g, '/') + pad;
        return atob(s);
    } catch {
        return '';
    }
}

/**
 * Parse JWT payload.
 */
function parseJwtPayload(token: string | null): Record<string, any> | null {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;
    try {
        const json = b64urlDecode(parts[1]);
        return JSON.parse(json);
    } catch {
        return null;
    }
}

/**
 * Extract email from JWT claims.
 */
function emailFromClaims(claims: Record<string, any> | null): string | null {
    if (!claims) return null;
    const candidates = [claims.email, claims.preferred_username, claims.upn, claims.username, claims.sub];
    return candidates.find((v) => typeof v === 'string' && v.trim().length > 0) || null;
}

/**
 * Format plan name for display.
 */
function formatPlan(p?: string) {
    if (!p) return 'Free';
    const up = p.toUpperCase();
    if (up === 'FREE') return 'Free';
    if (up === 'PREMIUM') return 'Premium';
    if (up === 'BUSINESS_PLUS' || up === 'PREMIUM_PLUS') return 'Premium Plus';
    return p;
}

/**
 * Format large numbers.
 */
function formatNumber(n: number) {
    if (!Number.isFinite(n) || n > 1e15) return '∞';
    return n.toLocaleString();
}

/**
 * Settings page sections.
 */
type SettingsSection = 'profile' | 'plan' | 'voice' | 'education' | 'security' | 'notifications';

/**
 * Comprehensive settings page for Lexaro.
 */
export default function SettingsPage() {
    const router = useRouter();

    // Current section
    const [section, setSection] = useState<SettingsSection>('profile');

    // User data
    const [email, setEmail] = useState<string>('');
    const [usage, setUsage] = useState<Usage | null>(null);
    const [voices, setVoices] = useState<Voice[]>([]);

    // Preferences (loaded from localStorage)
    const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES);

    // Password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [pwdBusy, setPwdBusy] = useState(false);
    const [pwdMsg, setPwdMsg] = useState('');
    const [pwdErr, setPwdErr] = useState('');

    // Billing state
    const [billingBusy, setBillingBusy] = useState(false);
    const [billingErr, setBillingErr] = useState('');

    // Preferences save state
    const [prefsSaved, setPrefsSaved] = useState(false);

    // Delete account modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    /**
     * Load initial data.
     */
    useEffect(() => {
        // Get email from JWT
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const claims = parseJwtPayload(token);
        const e = emailFromClaims(claims);
        if (e) setEmail(e);

        // Load usage data
        (async () => {
            try {
                const { data } = await api.get<Usage>('/me/usage');
                setUsage(data);
            } catch {
                // ignore
            }
        })();

        // Load voices
        (async () => {
            try {
                const v = await listVoices();
                setVoices(v);
            } catch {
                // ignore
            }
        })();

        // Load preferences from localStorage
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('lexaro_preferences');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    setPrefs({ ...DEFAULT_PREFERENCES, ...parsed });
                } catch {
                    // ignore
                }
            }
        }
    }, []);

    /**
     * Save preferences to localStorage.
     */
    const savePreferences = (newPrefs: Partial<UserPreferences>) => {
        const updated = { ...prefs, ...newPrefs };
        setPrefs(updated);
        if (typeof window !== 'undefined') {
            localStorage.setItem('lexaro_preferences', JSON.stringify(updated));
        }
        setPrefsSaved(true);
        setTimeout(() => setPrefsSaved(false), 2000);
    };

    /**
     * Handle password change submission.
     */
    const handleChangePassword = async () => {
        setPwdMsg('');
        setPwdErr('');

        if (newPassword !== confirmPassword) {
            setPwdErr('New passwords do not match.');
            return;
        }
        if (newPassword.length < 8) {
            setPwdErr('New password must be at least 8 characters.');
            return;
        }

        try {
            setPwdBusy(true);
            const res = await api.post<{ token?: string }>('/auth/change-password', {
                currentPassword,
                newPassword,
            });

            // Update token if returned
            if (res.data?.token && typeof window !== 'undefined') {
                localStorage.setItem('token', res.data.token);
            }

            setPwdMsg('Password changed successfully.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (e: any) {
            setPwdErr(e?.response?.data?.message || e?.message || 'Failed to change password.');
        } finally {
            setPwdBusy(false);
        }
    };

    /**
     * Handle logout.
     */
    const handleLogout = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
    };

    /**
     * Open Stripe billing portal.
     */
    const openBillingPortal = async () => {
        setBillingErr('');
        setBillingBusy(true);
        try {
            const { data } = await api.post<{ url?: string }>('/billing/portal', {});
            if (data?.url) {
                window.location.href = data.url;
                return;
            }
            setBillingErr('Could not open subscription manager.');
        } catch (e: any) {
            setBillingErr(e?.response?.data?.message || e?.message || 'Could not open subscription manager.');
        } finally {
            setBillingBusy(false);
        }
    };

    /**
     * Export user data (placeholder).
     */
    const handleExportData = () => {
        // In a real implementation, this would call an API endpoint
        alert('Data export requested. You will receive an email with your data shortly.');
    };

    // Plan display helpers
    const planRaw = (usage?.plan || 'FREE').toUpperCase();
    const isFree = planRaw === 'FREE';
    const isUnlimited = !!usage?.unlimited || (usage?.monthlyCap ?? 0) > 1e15;
    const monthlyPct = usage && !isUnlimited && usage.monthlyCap > 0
        ? Math.min(100, Math.round((usage.monthlyUsed / usage.monthlyCap) * 100))
        : 0;

    // Navigation items
    const navItems: { id: SettingsSection; label: string; icon: React.ReactNode }[] = [
        { id: 'profile', label: 'Profile', icon: <User className="h-4 w-4" /> },
        { id: 'plan', label: 'Plan & Usage', icon: <CreditCard className="h-4 w-4" /> },
        { id: 'voice', label: 'Voice Preferences', icon: <Mic className="h-4 w-4" /> },
        { id: 'education', label: 'Education', icon: <BookOpen className="h-4 w-4" /> },
        { id: 'security', label: 'Privacy & Security', icon: <Shield className="h-4 w-4" /> },
        { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
    ];

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <header className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur-xl">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-xl hover:bg-white/5 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 text-white/70" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <Settings className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold">Settings</h1>
                            <p className="text-xs text-white/50">{email}</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Navigation */}
                    <nav className="lg:w-64 shrink-0">
                        <div className="lg:sticky lg:top-24 space-y-1">
                            {navItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setSection(item.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                                        section === item.id
                                            ? 'bg-white/10 text-white'
                                            : 'text-white/60 hover:bg-white/5 hover:text-white'
                                    }`}
                                >
                                    {item.icon}
                                    {item.label}
                                    {section === item.id && (
                                        <ChevronRight className="h-4 w-4 ml-auto" />
                                    )}
                                </button>
                            ))}

                            <div className="pt-4 mt-4 border-t border-white/10">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Log Out
                                </button>
                            </div>
                        </div>
                    </nav>

                    {/* Content Area */}
                    <main className="flex-1 min-w-0">
                        <motion.div
                            key={section}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* Profile Section */}
                            {section === 'profile' && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-semibold mb-1">Profile</h2>
                                        <p className="text-sm text-white/50">Manage your account information</p>
                                    </div>

                                    {/* Email Display */}
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center">
                                                <span className="text-2xl font-bold text-white/80">
                                                    {(email?.[0] || 'U').toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="text-lg font-medium">{email || 'Not signed in'}</div>
                                                <div className="text-sm text-white/50">{formatPlan(usage?.plan)} Plan</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Change Password */}
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                                        <h3 className="text-lg font-medium mb-4">Change Password</h3>
                                        <div className="space-y-4 max-w-md">
                                            <PasswordField
                                                label="Current Password"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                visible={showCurrent}
                                                onToggle={() => setShowCurrent(!showCurrent)}
                                            />
                                            <PasswordField
                                                label="New Password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                visible={showNew}
                                                onToggle={() => setShowNew(!showNew)}
                                            />
                                            <PasswordField
                                                label="Confirm New Password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                visible={showConfirm}
                                                onToggle={() => setShowConfirm(!showConfirm)}
                                            />

                                            {pwdErr && <p className="text-sm text-red-400">{pwdErr}</p>}
                                            {pwdMsg && <p className="text-sm text-green-400">{pwdMsg}</p>}

                                            <button
                                                onClick={handleChangePassword}
                                                disabled={pwdBusy}
                                                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-sm font-medium transition-colors disabled:opacity-50"
                                            >
                                                {pwdBusy ? 'Updating...' : 'Update Password'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Plan & Usage Section */}
                            {section === 'plan' && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-semibold mb-1">Plan & Usage</h2>
                                        <p className="text-sm text-white/50">Manage your subscription and view usage</p>
                                    </div>

                                    {/* Current Plan */}
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-medium">Current Plan</h3>
                                            <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm font-medium">
                                                {formatPlan(usage?.plan)}
                                            </span>
                                        </div>

                                        {isFree ? (
                                            <div className="space-y-4">
                                                <p className="text-sm text-white/60">
                                                    Upgrade to Premium for higher limits and more features.
                                                </p>
                                                <Link
                                                    href="/billing"
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-sm font-medium transition-colors"
                                                >
                                                    <ArrowUpCircle className="h-4 w-4" />
                                                    Upgrade Plan
                                                </Link>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <button
                                                    onClick={openBillingPortal}
                                                    disabled={billingBusy}
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-sm font-medium transition-colors disabled:opacity-50"
                                                >
                                                    {billingBusy ? 'Opening...' : 'Manage Subscription'}
                                                    <ExternalLink className="h-4 w-4" />
                                                </button>
                                                {billingErr && <p className="text-sm text-red-400">{billingErr}</p>}
                                            </div>
                                        )}
                                    </div>

                                    {/* Usage Stats */}
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                                        <h3 className="text-lg font-medium mb-4">Usage This Month</h3>

                                        {usage ? (
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                    <StatCard
                                                        icon={<Gauge className="h-5 w-5 text-amber-400" />}
                                                        iconBg="bg-amber-500/20"
                                                        label="Chars Used"
                                                        value={formatNumber(usage.monthlyUsed)}
                                                    />
                                                    <StatCard
                                                        icon={<Zap className="h-5 w-5 text-green-400" />}
                                                        iconBg="bg-green-500/20"
                                                        label="Chars Left"
                                                        value={formatNumber(usage.monthlyRemaining)}
                                                    />
                                                    <StatCard
                                                        icon={<CreditCard className="h-5 w-5 text-blue-400" />}
                                                        iconBg="bg-blue-500/20"
                                                        label="Monthly Cap"
                                                        value={formatNumber(usage.monthlyCap)}
                                                    />
                                                </div>

                                                {!isUnlimited && (
                                                    <div>
                                                        <div className="flex items-center justify-between text-sm mb-2">
                                                            <span className="text-white/60">Monthly Usage</span>
                                                            <span className="text-white/80">{monthlyPct}%</span>
                                                        </div>
                                                        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                                                                style={{ width: `${monthlyPct}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {isUnlimited && (
                                                    <p className="text-sm text-white/50">
                                                        Your plan has unlimited usage. Usage is tracked for your reference.
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-white/50">Loading usage data...</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Voice Preferences Section */}
                            {section === 'voice' && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-semibold mb-1">Voice Preferences</h2>
                                        <p className="text-sm text-white/50">Customize your text-to-speech experience</p>
                                    </div>

                                    {/* Default Voice */}
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="h-10 w-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                                                <Volume2 className="h-5 w-5 text-cyan-400" />
                                            </div>
                                            <h3 className="text-lg font-medium">Default Voice</h3>
                                        </div>
                                        <p className="text-sm text-white/50 mb-4">
                                            Select a default voice for new audio generations. You can always change it per document.
                                        </p>
                                        <select
                                            value={prefs.defaultVoice}
                                            onChange={(e) => savePreferences({ defaultVoice: e.target.value })}
                                            className="w-full max-w-sm px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-white/20"
                                        >
                                            <option value="">Auto (System Default)</option>
                                            {voices.map((v) => (
                                                <option key={v.name} value={v.name}>
                                                    {v.name} ({v.gender}, {v.language})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Playback Speed */}
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                                <Gauge className="h-5 w-5 text-purple-400" />
                                            </div>
                                            <h3 className="text-lg font-medium">Default Playback Speed</h3>
                                        </div>
                                        <p className="text-sm text-white/50 mb-4">
                                            Set your preferred playback speed for audio files.
                                        </p>
                                        <div className="flex items-center gap-4 max-w-sm">
                                            <input
                                                type="range"
                                                min="0.5"
                                                max="2"
                                                step="0.25"
                                                value={prefs.playbackSpeed}
                                                onChange={(e) => savePreferences({ playbackSpeed: parseFloat(e.target.value) })}
                                                className="flex-1 accent-purple-500"
                                            />
                                            <span className="w-12 text-sm text-white/80 text-center">
                                                {prefs.playbackSpeed}x
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xs text-white/40 max-w-sm mt-1 px-1">
                                            <span>0.5x</span>
                                            <span>1x</span>
                                            <span>1.5x</span>
                                            <span>2x</span>
                                        </div>
                                    </div>

                                    {prefsSaved && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-center gap-2 text-sm text-green-400"
                                        >
                                            <Check className="h-4 w-4" />
                                            Preferences saved
                                        </motion.div>
                                    )}
                                </div>
                            )}

                            {/* Education Preferences Section */}
                            {section === 'education' && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-semibold mb-1">Education Preferences</h2>
                                        <p className="text-sm text-white/50">Customize your learning experience</p>
                                    </div>

                                    {/* Quiz Difficulty */}
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                                <HelpCircle className="h-5 w-5 text-amber-400" />
                                            </div>
                                            <h3 className="text-lg font-medium">Default Quiz Difficulty</h3>
                                        </div>
                                        <p className="text-sm text-white/50 mb-4">
                                            Set the default difficulty level for generated quizzes.
                                        </p>
                                        <div className="flex gap-3">
                                            {(['easy', 'medium', 'hard'] as const).map((level) => (
                                                <button
                                                    key={level}
                                                    onClick={() => savePreferences({ quizDifficulty: level })}
                                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                                        prefs.quizDifficulty === level
                                                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                            : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                                                    }`}
                                                >
                                                    {level.charAt(0).toUpperCase() + level.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Note Style */}
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="h-10 w-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                                                <FileText className="h-5 w-5 text-green-400" />
                                            </div>
                                            <h3 className="text-lg font-medium">Default Note Style</h3>
                                        </div>
                                        <p className="text-sm text-white/50 mb-4">
                                            Choose your preferred style for generated study notes.
                                        </p>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {([
                                                { id: 'outline', label: 'Outline', desc: 'Hierarchical structure' },
                                                { id: 'cornell', label: 'Cornell', desc: 'Questions & answers' },
                                                { id: 'detailed', label: 'Detailed', desc: 'Comprehensive notes' },
                                                { id: 'summary', label: 'Summary', desc: 'Brief overview' },
                                            ] as const).map((style) => (
                                                <button
                                                    key={style.id}
                                                    onClick={() => savePreferences({ defaultNoteStyle: style.id })}
                                                    className={`p-4 rounded-xl text-left transition-all ${
                                                        prefs.defaultNoteStyle === style.id
                                                            ? 'bg-green-500/20 border border-green-500/30'
                                                            : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                                    }`}
                                                >
                                                    <div className="font-medium text-sm">{style.label}</div>
                                                    <div className="text-xs text-white/50 mt-1">{style.desc}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {prefsSaved && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-center gap-2 text-sm text-green-400"
                                        >
                                            <Check className="h-4 w-4" />
                                            Preferences saved
                                        </motion.div>
                                    )}
                                </div>
                            )}

                            {/* Privacy & Security Section */}
                            {section === 'security' && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-semibold mb-1">Privacy & Security</h2>
                                        <p className="text-sm text-white/50">Manage your data and account security</p>
                                    </div>

                                    {/* Export Data */}
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                                <Download className="h-5 w-5 text-blue-400" />
                                            </div>
                                            <h3 className="text-lg font-medium">Export Your Data</h3>
                                        </div>
                                        <p className="text-sm text-white/50 mb-4">
                                            Download a copy of all your data including documents, audio files, and study materials.
                                        </p>
                                        <button
                                            onClick={handleExportData}
                                            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-sm font-medium transition-colors"
                                        >
                                            Request Data Export
                                        </button>
                                    </div>

                                    {/* Sessions */}
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                                <Shield className="h-5 w-5 text-purple-400" />
                                            </div>
                                            <h3 className="text-lg font-medium">Active Sessions</h3>
                                        </div>
                                        <p className="text-sm text-white/50 mb-4">
                                            You are currently logged in on this device. Log out to end your session.
                                        </p>
                                        <button
                                            onClick={handleLogout}
                                            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-sm font-medium transition-colors"
                                        >
                                            Log Out of This Device
                                        </button>
                                    </div>

                                    {/* Delete Account */}
                                    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="h-10 w-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                                                <Trash2 className="h-5 w-5 text-red-400" />
                                            </div>
                                            <h3 className="text-lg font-medium text-red-400">Delete Account</h3>
                                        </div>
                                        <p className="text-sm text-white/50 mb-4">
                                            Permanently delete your account and all associated data. This action cannot be undone.
                                        </p>
                                        <button
                                            onClick={() => setShowDeleteModal(true)}
                                            className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-sm font-medium transition-colors"
                                        >
                                            Delete My Account
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Notifications Section */}
                            {section === 'notifications' && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-semibold mb-1">Notifications</h2>
                                        <p className="text-sm text-white/50">Manage how you receive updates</p>
                                    </div>

                                    {/* Email Notifications */}
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                                    <Bell className="h-5 w-5 text-blue-400" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium">Email Notifications</h3>
                                                    <p className="text-sm text-white/50">
                                                        Receive updates about your account and new features
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => savePreferences({ emailNotifications: !prefs.emailNotifications })}
                                                className={`relative w-12 h-6 rounded-full transition-colors ${
                                                    prefs.emailNotifications ? 'bg-purple-500' : 'bg-white/20'
                                                }`}
                                            >
                                                <span
                                                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                                                        prefs.emailNotifications ? 'left-7' : 'left-1'
                                                    }`}
                                                />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Product Updates */}
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                                                    <Zap className="h-5 w-5 text-green-400" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium">Product Updates</h3>
                                                    <p className="text-sm text-white/50">
                                                        Get notified about new features and improvements
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                className="relative w-12 h-6 rounded-full bg-purple-500 transition-colors"
                                            >
                                                <span className="absolute top-1 left-7 w-4 h-4 rounded-full bg-white" />
                                            </button>
                                        </div>
                                    </div>

                                    {prefsSaved && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-center gap-2 text-sm text-green-400"
                                        >
                                            <Check className="h-4 w-4" />
                                            Preferences saved
                                        </motion.div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </main>
                </div>
            </div>

            {/* Delete Account Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={() => setShowDeleteModal(false)}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl p-6"
                    >
                        <h3 className="text-lg font-semibold text-red-400 mb-2">Delete Account</h3>
                        <p className="text-sm text-white/60 mb-4">
                            This will permanently delete your account, all documents, audio files, and study materials.
                            Type <span className="text-white font-mono">DELETE</span> to confirm.
                        </p>
                        <input
                            type="text"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="Type DELETE to confirm"
                            className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm mb-4 focus:outline-none focus:border-red-500/50"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setDeleteConfirmText('');
                                }}
                                className="flex-1 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={deleteConfirmText !== 'DELETE'}
                                onClick={() => {
                                    // In a real implementation, this would call an API endpoint
                                    alert('Account deletion requested. You will receive a confirmation email.');
                                    setShowDeleteModal(false);
                                }}
                                className="flex-1 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Delete Account
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

/**
 * Password input field with visibility toggle.
 */
function PasswordField({
    label,
    value,
    onChange,
    visible,
    onToggle,
}: {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    visible: boolean;
    onToggle: () => void;
}) {
    return (
        <label className="block">
            <span className="text-sm text-white/60 mb-1 block">{label}</span>
            <div className="relative">
                <input
                    type={visible ? 'text' : 'password'}
                    value={value}
                    onChange={onChange}
                    autoComplete="new-password"
                    className="w-full px-4 py-2 pr-10 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-white/20"
                />
                <button
                    type="button"
                    onClick={onToggle}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
                    tabIndex={-1}
                >
                    {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
            </div>
        </label>
    );
}

/**
 * Stat card component for displaying metrics.
 */
function StatCard({
    icon,
    iconBg,
    label,
    value,
}: {
    icon: React.ReactNode;
    iconBg: string;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg ${iconBg} flex items-center justify-center`}>
                    {icon}
                </div>
                <div>
                    <div className="text-lg font-semibold">{value}</div>
                    <div className="text-xs text-white/50">{label}</div>
                </div>
            </div>
        </div>
    );
}

// Missing import
function ArrowUpCircle({ className }: { className?: string }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="16 12 12 8 8 12" />
            <line x1="12" y1="16" x2="12" y2="8" />
        </svg>
    );
}
