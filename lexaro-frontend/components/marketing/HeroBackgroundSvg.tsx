/**
 * HeroBackgroundSvg — full-bleed illustrated hero background for the hero section.
 *
 * Original study-focused illustrated scene: stylized floating laptop centerpiece with
 * orbiting study elements (citation tags, flashcard, sparkles, document stack, quiz
 * bubble, aqua dots) and a multi-color halo ring. Purely decorative — aria-hidden,
 * pointer-events-none.
 *
 * SVG layers (bottom → top):
 *   1. Dot-grid texture (full canvas)
 *   2. Main atmospheric halo (radial gradient ellipse, slow pulse)
 *   3. Two dashed orbit rings (very slow rotation)
 *   4. Laptop centerpiece (slow vertical bob, screen glow, abstract UI lines)
 *   5. Orbiting study elements (8 items, staggered drift animations)
 *   6. Left-side fade mask (keeps headline text readable)
 *
 * Animations:
 *   - bob 8s — centerpiece floats up/down 14px
 *   - halo-pulse 12s — ambient glow breathes
 *   - halo-spin 70/100s — orbit rings rotate very slowly
 *   - drift-1…8 — orbiting elements translate gently with staggered delays
 *   - sparkle-pulse 6s — star sparkles scale/fade
 *   - prefers-reduced-motion: all animations disabled, static scene remains
 *
 * Cookbook references applied:
 *   - prompting_for_frontend_aesthetics.ipynb: atmosphere via layers; dominant accent
 *     (#228CDB) + sharp aqua/purple pops; staggered delays for high-impact reveal
 *   - applying-brand-guidelines/SKILL.md: prefers-reduced-motion, aria-hidden,
 *     illustration never competes with primary content (left fade mask)
 *
 * No "use client" needed — purely declarative JSX.
 */
export default function HeroBackgroundSvg() {
    return (
        <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
        >
            <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 1440 800"
                preserveAspectRatio="xMidYMid slice"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    {/* ── Dot-grid tile pattern ── */}
                    <pattern id="hb-dot-grid" x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse">
                        <circle cx="18" cy="18" r="0.85" fill="rgba(255,255,255,0.05)" />
                    </pattern>

                    {/* ── Main atmospheric halo — multi-color radial gradient ── */}
                    <radialGradient id="hb-main-halo" cx="50%" cy="50%" r="50%">
                        <stop offset="0%"   stopColor="#228CDB" stopOpacity="0.13" />
                        <stop offset="38%"  stopColor="#4DA3FF" stopOpacity="0.07" />
                        <stop offset="68%"  stopColor="#A855F7" stopOpacity="0.04" />
                        <stop offset="100%" stopColor="#000000" stopOpacity="0"    />
                    </radialGradient>

                    {/* ── Screen inner glow — soft blue radial ── */}
                    <radialGradient id="hb-screen-glow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%"   stopColor="#228CDB" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="#228CDB" stopOpacity="0"    />
                    </radialGradient>

                    {/* ── Left-side fade mask — keeps H1 legible ── */}
                    <linearGradient id="hb-left-fade" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%"   stopColor="#000000" stopOpacity="0.82" />
                        <stop offset="30%"  stopColor="#000000" stopOpacity="0.48" />
                        <stop offset="52%"  stopColor="#000000" stopOpacity="0"    />
                    </linearGradient>

                    {/* ── Soft glow filter for orbit rings ── */}
                    <filter id="hb-ring-glow" x="-10%" y="-10%" width="120%" height="120%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    {/* ── Keyframe animations + prefers-reduced-motion ── */}
                    <style>{`
                        /* Laptop centerpiece: slow vertical float */
                        @keyframes hb-bob {
                          0%, 100% { transform: translateY(0px); }
                          50%       { transform: translateY(-14px); }
                        }
                        /* Atmospheric halo: gentle opacity breathe */
                        @keyframes hb-halo-pulse {
                          0%, 100% { opacity: 0.65; }
                          50%       { opacity: 1; }
                        }
                        /* Orbit rings: very slow clockwise rotation */
                        @keyframes hb-spin {
                          from { transform: rotate(0deg);   }
                          to   { transform: rotate(360deg); }
                        }
                        /* Orbiting element drift keyframes — each unique */
                        @keyframes hb-drift-1 {
                          0%, 100% { transform: translate(0px,   0px);  }
                          33%       { transform: translate(7px,  -11px); }
                          66%       { transform: translate(-4px,  7px);  }
                        }
                        @keyframes hb-drift-2 {
                          0%, 100% { transform: translate(0px,   0px);  }
                          40%       { transform: translate(-9px, -6px);  }
                          70%       { transform: translate(5px,   10px); }
                        }
                        @keyframes hb-drift-3 {
                          0%, 100% { transform: translate(0px,  0px);  }
                          50%       { transform: translate(10px, -8px); }
                        }
                        @keyframes hb-drift-4 {
                          0%, 100% { transform: translate(0px,  0px);  }
                          45%       { transform: translate(-7px, 9px);  }
                          80%       { transform: translate(6px, -5px);  }
                        }
                        @keyframes hb-drift-5 {
                          0%, 100% { transform: translate(0px,  0px);  }
                          35%       { transform: translate(8px, -7px);  }
                          65%       { transform: translate(-5px, 9px);  }
                        }
                        @keyframes hb-drift-6 {
                          0%, 100% { transform: translate(0px,   0px);   }
                          55%       { transform: translate(-8px, -10px); }
                        }
                        @keyframes hb-drift-7 {
                          0%, 100% { transform: translate(0px,  0px);   }
                          40%       { transform: translate(9px, -7px);   }
                          75%       { transform: translate(-6px, 11px);  }
                        }
                        @keyframes hb-drift-8 {
                          0%, 100% { transform: translate(0px,   0px);  }
                          50%       { transform: translate(-10px, -8px); }
                        }
                        /* Sparkle: gentle scale + opacity pulse */
                        @keyframes hb-sparkle {
                          0%, 100% { opacity: 0.38; transform: scale(0.82); }
                          50%       { opacity: 0.90; transform: scale(1.18); }
                        }

                        /* ── Class bindings ── */
                        .hb-bob {
                          animation: hb-bob 8s ease-in-out infinite;
                          transform-origin: 1050px 375px;
                        }
                        .hb-halo-pulse {
                          animation: hb-halo-pulse 12s ease-in-out infinite;
                        }
                        .hb-spin {
                          animation: hb-spin 70s linear infinite;
                          transform-box: fill-box;
                          transform-origin: center;
                        }
                        .hb-spin-slow {
                          animation: hb-spin 100s linear infinite reverse;
                          transform-box: fill-box;
                          transform-origin: center;
                        }
                        .hb-drift-1 { animation: hb-drift-1 14s ease-in-out infinite; }
                        .hb-drift-2 { animation: hb-drift-2 16s ease-in-out infinite; animation-delay: -3s; }
                        .hb-drift-3 { animation: hb-drift-3 11s ease-in-out infinite; animation-delay: -5s; }
                        .hb-drift-4 { animation: hb-drift-4 18s ease-in-out infinite; animation-delay: -8s; }
                        .hb-drift-5 { animation: hb-drift-5 13s ease-in-out infinite; animation-delay: -2s; }
                        .hb-drift-6 { animation: hb-drift-6 15s ease-in-out infinite; animation-delay: -6s; }
                        .hb-drift-7 { animation: hb-drift-7 12s ease-in-out infinite; animation-delay: -4s; }
                        .hb-drift-8 { animation: hb-drift-8 17s ease-in-out infinite; animation-delay: -9s; }
                        .hb-sparkle { animation: hb-sparkle 6s ease-in-out infinite; }

                        /* ── Accessibility: freeze all motion ── */
                        @media (prefers-reduced-motion: reduce) {
                          .hb-bob,
                          .hb-halo-pulse,
                          .hb-spin,
                          .hb-spin-slow,
                          .hb-drift-1, .hb-drift-2, .hb-drift-3, .hb-drift-4,
                          .hb-drift-5, .hb-drift-6, .hb-drift-7, .hb-drift-8,
                          .hb-sparkle {
                            animation: none !important;
                          }
                        }

                        /* ── Mobile: pan scene left so illustration centres on screen ──
                           On mobile (< 1024px) xMidYMid slice shows SVG x≈506–934.
                           The illustration is centred at x=1050, ~330 user-units right of
                           the SVG mid-point (720). Shifting the scene -330 user-units
                           brings x=1050 → x=720 → the horizontal centre of the viewport. */
                        @media (max-width: 1023px) {
                          .hb-scene {
                            transform: translateX(-330px);
                          }
                        }
                    `}</style>
                </defs>

                {/* hb-scene: all layers shift together on mobile via @media translateX */}
                <g className="hb-scene">

                {/* ══════════════════════════════════════════
                    Layer 0: Dot-grid texture (full canvas)
                   ══════════════════════════════════════════ */}
                <rect width="1440" height="800" fill="url(#hb-dot-grid)" />

                {/* ══════════════════════════════════════════
                    Layer 1: Main atmospheric halo
                    Centered at (1050, 390) — illustration center
                   ══════════════════════════════════════════ */}
                <ellipse
                    cx="1050" cy="390"
                    rx="285" ry="232"
                    fill="url(#hb-main-halo)"
                    className="hb-halo-pulse"
                />

                {/* ══════════════════════════════════════════
                    Layer 2: Dashed orbit rings (very slow spin)
                   ══════════════════════════════════════════ */}
                <ellipse
                    cx="1050" cy="390"
                    rx="196" ry="157"
                    fill="none"
                    stroke="rgba(34,140,219,0.13)"
                    strokeWidth="1"
                    strokeDasharray="4 6"
                    filter="url(#hb-ring-glow)"
                    className="hb-spin"
                />
                <ellipse
                    cx="1050" cy="390"
                    rx="258" ry="207"
                    fill="none"
                    stroke="rgba(77,163,255,0.07)"
                    strokeWidth="0.8"
                    strokeDasharray="2 9"
                    className="hb-spin-slow"
                />

                {/* ══════════════════════════════════════════
                    Layer 3: Laptop centerpiece (slow bob)
                    Center at (1050, 375) approx.
                    All child coords are absolute SVG coords.
                   ══════════════════════════════════════════ */}
                <g className="hb-bob">
                    {/* Screen frame — outer border */}
                    <rect
                        x="930" y="248"
                        width="240" height="162"
                        rx="10"
                        fill="rgba(34,140,219,0.07)"
                        stroke="rgba(34,140,219,0.28)"
                        strokeWidth="1.5"
                    />
                    {/* Screen display — darker inner fill */}
                    <rect
                        x="940" y="256"
                        width="220" height="146"
                        rx="6"
                        fill="rgba(0,0,0,0.32)"
                        stroke="rgba(34,140,219,0.10)"
                        strokeWidth="0.5"
                    />
                    {/* Screen inner glow — centered radial */}
                    <ellipse
                        cx="1050" cy="328"
                        rx="82" ry="52"
                        fill="url(#hb-screen-glow)"
                    />

                    {/* ── Abstract chat UI inside screen (pure rects, no text) ── */}

                    {/* AI bubble 1 — two lines suggesting a message */}
                    <rect x="956" y="272" width="88"  height="7"   rx="3.5" fill="rgba(255,255,255,0.12)" />
                    <rect x="956" y="283" width="118" height="7"   rx="3.5" fill="rgba(255,255,255,0.08)" />

                    {/* User bubble — right-aligned, blue-filled */}
                    <rect x="1002" y="298" width="140" height="10" rx="5"   fill="rgba(34,140,219,0.28)" />

                    {/* Citation chip tag [p.12] — small filled pill */}
                    <rect x="956"  y="315" width="28"  height="7"   rx="3.5" fill="rgba(34,140,219,0.50)" />
                    {/* AI bubble text line after chip */}
                    <rect x="990"  y="315" width="78"  height="7"   rx="3.5" fill="rgba(255,255,255,0.07)" />

                    {/* AI bubble 2 — short line */}
                    <rect x="956"  y="328" width="92"  height="7"   rx="3.5" fill="rgba(255,255,255,0.07)" />

                    {/* Generated flashcard chips — 2×2 grid */}
                    <rect x="956"  y="342" width="54"  height="10"  rx="5"
                        fill="rgba(34,140,219,0.15)" stroke="rgba(34,140,219,0.28)" strokeWidth="0.5" />
                    <rect x="1016" y="342" width="54"  height="10"  rx="5"
                        fill="rgba(34,140,219,0.15)" stroke="rgba(34,140,219,0.28)" strokeWidth="0.5" />
                    <rect x="956"  y="356" width="54"  height="10"  rx="5"
                        fill="rgba(34,140,219,0.10)" stroke="rgba(34,140,219,0.20)" strokeWidth="0.5" />
                    <rect x="1016" y="356" width="54"  height="10"  rx="5"
                        fill="rgba(34,140,219,0.10)" stroke="rgba(34,140,219,0.20)" strokeWidth="0.5" />

                    {/* Input bar at screen bottom */}
                    <rect x="956"  y="377" width="198" height="12"  rx="6"
                        fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.09)" strokeWidth="0.5" />

                    {/* Hinge strip */}
                    <rect x="926" y="410" width="248" height="5" rx="2.5" fill="rgba(255,255,255,0.09)" />

                    {/* Keyboard base — trapezoid path */}
                    <path
                        d="M 908,415 L 1192,415 L 1202,440 L 898,440 Z"
                        fill="rgba(255,255,255,0.03)"
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth="1"
                    />
                    {/* Keyboard surface texture */}
                    <rect x="928" y="422" width="244" height="6" rx="3" fill="rgba(255,255,255,0.025)" />
                    {/* Trackpad */}
                    <rect x="1000" y="426" width="100" height="8" rx="4"
                        fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="0.8" />
                </g>

                {/* ══════════════════════════════════════════
                    Layer 4: Orbiting study elements
                    Each sits in its own <g> with drift animation
                   ══════════════════════════════════════════ */}

                {/* ── 1. Citation tag [p.12] — upper right, radius ~168 at ~42° ── */}
                <g className="hb-drift-1" style={{ transformOrigin: "1184px 266px" }}>
                    <rect
                        x="1156" y="254"
                        width="56" height="22"
                        rx="11"
                        fill="rgba(34,140,219,0.12)"
                        stroke="rgba(34,140,219,0.38)"
                        strokeWidth="1"
                    />
                    {/* [p.12] suggestion — small colored rects mimicking text */}
                    <rect x="1164" y="261" width="7"  height="2" rx="1" fill="rgba(34,140,219,0.65)" />
                    <rect x="1173" y="261" width="12" height="2" rx="1" fill="rgba(34,140,219,0.50)" />
                    <rect x="1173" y="265" width="8"  height="2" rx="1" fill="rgba(34,140,219,0.40)" />
                </g>

                {/* ── 2. Flashcard — lower right, radius ~175 at ~320° ── */}
                <g className="hb-drift-2" style={{ transformOrigin: "1191px 519px" }}>
                    <rect
                        x="1162" y="501"
                        width="58" height="38"
                        rx="8"
                        fill="rgba(34,140,219,0.08)"
                        stroke="rgba(34,140,219,0.26)"
                        strokeWidth="1"
                    />
                    {/* Card label line */}
                    <rect x="1170" y="509" width="14" height="2" rx="1" fill="rgba(34,140,219,0.45)" />
                    {/* Card content lines */}
                    <rect x="1170" y="516" width="40" height="2.5" rx="1.25" fill="rgba(255,255,255,0.16)" />
                    <rect x="1170" y="522" width="30" height="2.5" rx="1.25" fill="rgba(255,255,255,0.10)" />
                    <rect x="1170" y="528" width="35" height="2.5" rx="1.25" fill="rgba(255,255,255,0.07)" />
                </g>

                {/* ── 3. Blue sparkle ✦ — upper area, ~83° radius ~155 ── */}
                <g className="hb-drift-3 hb-sparkle" style={{ transformOrigin: "1069px 220px" }}>
                    {/* 4-point star: two small rects rotated 45° apart */}
                    <rect x="1065" y="214" width="8" height="12" rx="4" fill="rgba(77,163,255,0.65)" transform="rotate(0,1069,220)" />
                    <rect x="1065" y="214" width="8" height="12" rx="4" fill="rgba(77,163,255,0.45)" transform="rotate(45,1069,220)" />
                </g>

                {/* ── 4. Quiz bubble — left of laptop, ~215° radius ~150 ── */}
                <g className="hb-drift-4" style={{ transformOrigin: "926px 460px" }}>
                    <rect
                        x="900" y="446"
                        width="52" height="28"
                        rx="8"
                        fill="rgba(168,85,247,0.09)"
                        stroke="rgba(168,85,247,0.28)"
                        strokeWidth="1"
                    />
                    {/* Quiz lines */}
                    <rect x="908" y="454" width="36" height="2.5" rx="1.25" fill="rgba(168,85,247,0.45)" />
                    <rect x="908" y="460" width="26" height="2.5" rx="1.25" fill="rgba(168,85,247,0.28)" />
                    <rect x="908" y="466" width="30" height="2.5" rx="1.25" fill="rgba(168,85,247,0.18)" />
                </g>

                {/* ── 5. Document stack — right, ~5° radius ~196 ── */}
                <g className="hb-drift-5" style={{ transformOrigin: "1246px 375px" }}>
                    {/* Back document (slightly rotated) */}
                    <rect
                        x="1224" y="360"
                        width="38" height="30"
                        rx="4"
                        fill="rgba(255,255,255,0.03)"
                        stroke="rgba(255,255,255,0.10)"
                        strokeWidth="0.8"
                        transform="rotate(-7,1243,375)"
                    />
                    {/* Front document */}
                    <rect
                        x="1228" y="362"
                        width="38" height="30"
                        rx="4"
                        fill="rgba(34,140,219,0.07)"
                        stroke="rgba(34,140,219,0.24)"
                        strokeWidth="1"
                    />
                    {/* Document lines */}
                    <rect x="1235" y="369" width="24" height="2"   rx="1"    fill="rgba(255,255,255,0.18)" />
                    <rect x="1235" y="374" width="18" height="2"   rx="1"    fill="rgba(255,255,255,0.12)" />
                    <rect x="1235" y="379" width="21" height="2"   rx="1"    fill="rgba(255,255,255,0.08)" />
                </g>

                {/* ── 6. Aqua sparkle ✦ — upper far right, ~60° radius ~220 ── */}
                <g className="hb-drift-6 hb-sparkle" style={{ animationDelay: "1.4s", transformOrigin: "1160px 200px" }}>
                    <rect x="1156" y="194" width="6" height="10" rx="3" fill="rgba(42,252,152,0.55)" transform="rotate(0,1160,199)" />
                    <rect x="1156" y="194" width="6" height="10" rx="3" fill="rgba(42,252,152,0.38)" transform="rotate(45,1160,199)" />
                </g>

                {/* ── 7. Aqua dot — lower left of scene ── */}
                <g className="hb-drift-7" style={{ transformOrigin: "978px 542px" }}>
                    <circle cx="978" cy="542" r="4.5" fill="rgba(42,252,152,0.32)" stroke="rgba(42,252,152,0.50)" strokeWidth="0.8" />
                </g>

                {/* ── 8. Small node cluster — far right edge ── */}
                <g className="hb-drift-8" style={{ transformOrigin: "1375px 352px" }}>
                    <circle cx="1368" cy="344" r="3"   fill="rgba(34,140,219,0.38)" />
                    <circle cx="1383" cy="358" r="2"   fill="rgba(77,163,255,0.28)" />
                    <circle cx="1374" cy="370" r="2.5" fill="rgba(34,140,219,0.28)" />
                    <line x1="1368" y1="344" x2="1383" y2="358" stroke="rgba(34,140,219,0.18)" strokeWidth="0.8" />
                    <line x1="1383" y1="358" x2="1374" y2="370" stroke="rgba(34,140,219,0.12)" strokeWidth="0.8" />
                </g>

                {/* ══════════════════════════════════════════
                    Layer 5: Left-side fade mask — always static
                    Darkens the left half so H1 stays fully readable
                   ══════════════════════════════════════════ */}
                <rect width="1440" height="800" fill="url(#hb-left-fade)" />

                </g>{/* end hb-scene */}
            </svg>
        </div>
    );
}
