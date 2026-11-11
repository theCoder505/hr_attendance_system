import { Check, Fingerprint, Loader2, Sparkles } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface FingerprintScannerProps {
    mode: 'check-in' | 'check-out';
    onScanComplete: () => void;
    loading?: boolean;
    disabled?: boolean;
    holdDurationMs?: number;
}

export default function FingerprintScanner({
    mode,
    onScanComplete,
    loading = false,
    disabled = false,
    holdDurationMs = 850,
}: FingerprintScannerProps) {
    const [progress, setProgress] = useState(0);
    const [isHolding, setIsHolding] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [hint, setHint] = useState<string | null>(null);

    const animationRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const hintTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isCheckIn = mode === 'check-in';

    // SVG Circle perimeter calculation
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    const cleanupAnimation = () => {
        if (animationRef.current !== null) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
        startTimeRef.current = null;
    };

    useEffect(() => {
        return () => {
            cleanupAnimation();
            if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
        };
    }, []);

    const startHolding = (e?: React.SyntheticEvent) => {
        if (disabled || loading || isVerified) return;
        if (e && 'button' in e && (e as React.MouseEvent).button !== 0) return;

        // Prevent default touch gestures (pinch/scroll/contextmenu)
        if (e && e.cancelable) {
            e.preventDefault();
        }

        if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
        setHint(null);
        setIsHolding(true);
        startTimeRef.current = performance.now();

        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try {
                navigator.vibrate(35);
            } catch (_) { }
        }

        const step = (now: number) => {
            if (startTimeRef.current === null) return;
            const elapsed = now - startTimeRef.current;
            const pct = Math.min(100, (elapsed / holdDurationMs) * 100);
            setProgress(pct);

            if (pct < 100) {
                animationRef.current = requestAnimationFrame(step);
            } else {
                // Completed hold!
                cleanupAnimation();
                setIsHolding(false);
                setIsVerified(true);

                if (typeof navigator !== 'undefined' && navigator.vibrate) {
                    try {
                        navigator.vibrate([50, 40, 70]);
                    } catch (_) { }
                }

                // Trigger action
                setTimeout(() => {
                    onScanComplete();
                    setTimeout(() => {
                        setIsVerified(false);
                        setProgress(0);
                    }, 1200);
                }, 350);
            }
        };

        animationRef.current = requestAnimationFrame(step);
    };

    const cancelHolding = () => {
        if (isVerified || loading) return;

        cleanupAnimation();

        if (isHolding) {
            setIsHolding(false);
            if (progress > 12 && progress < 100) {
                setHint('Hold finger on sensor for ~1s');
                if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
                hintTimeoutRef.current = setTimeout(() => setHint(null), 2500);
            }
            setProgress(0);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.repeat) return;
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            startHolding();
        }
    };

    const handleKeyUp = (e: React.KeyboardEvent) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            cancelHolding();
        }
    };

    // Color definitions
    const theme = isCheckIn
        ? {
            colorName: 'emerald',
            laserBg: 'from-transparent via-emerald-400 to-transparent',
            laserShadow: 'shadow-[0_0_15px_#10b981]',
            sweepBg: 'from-emerald-500/20 via-emerald-500/10 to-transparent',
            strokeGradientId: 'checkin-gradient',
            gradientFrom: '#10b981',
            gradientTo: '#06b6d4',
            activeGlow: 'shadow-[0_0_40px_rgba(16,185,129,0.45)]',
            idleBorder: 'border-emerald-500/30 dark:border-emerald-500/40',
            activeBorder: 'border-emerald-400 dark:border-emerald-400',
            iconActive: 'text-emerald-500 dark:text-emerald-400',
            bracketBorder: 'border-emerald-500/40 dark:border-emerald-400/50',
            badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
            buttonTitle: 'Clock In',
            actionVerb: 'Clocking In',
        }
        : {
            colorName: 'amber',
            laserBg: 'from-transparent via-amber-400 to-transparent',
            laserShadow: 'shadow-[0_0_15px_#f59e0b]',
            sweepBg: 'from-amber-500/20 via-amber-500/10 to-transparent',
            strokeGradientId: 'checkout-gradient',
            gradientFrom: '#f59e0b',
            gradientTo: '#f43f5e',
            activeGlow: 'shadow-[0_0_40px_rgba(245,158,11,0.45)]',
            idleBorder: 'border-amber-500/30 dark:border-amber-500/40',
            activeBorder: 'border-amber-400 dark:border-amber-400',
            iconActive: 'text-amber-500 dark:text-amber-400',
            bracketBorder: 'border-amber-500/40 dark:border-amber-400/50',
            badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
            buttonTitle: 'Clock Out',
            actionVerb: 'Clocking Out',
        };

    return (
        <div className="flex flex-col items-center justify-center select-none">
            {/* Inline keyframe animations */}
            <style>{`
                @keyframes scanBeam {
                    0% { top: 4%; opacity: 0.8; }
                    50% { top: 88%; opacity: 1; }
                    100% { top: 4%; opacity: 0.8; }
                }
                @keyframes scannerRipple {
                    0% { transform: scale(0.92); opacity: 0.8; }
                    100% { transform: scale(1.35); opacity: 0; }
                }
                @keyframes scannerBreathing {
                    0%, 100% { transform: scale(1); opacity: 0.35; }
                    50% { transform: scale(1.06); opacity: 0.7; }
                }
            `}</style>

            {/* Biometric Interactive Scanner Container */}
            <div className="relative flex items-center justify-center p-2">
                {/* Ambient Aura Background */}
                <div
                    className={`absolute -inset-3 rounded-full transition-all duration-500 blur-xl pointer-events-none ${isVerified
                        ? 'bg-emerald-500/30 scale-125'
                        : isHolding
                            ? isCheckIn
                                ? 'bg-emerald-500/25 scale-110'
                                : 'bg-amber-500/25 scale-110'
                            : 'bg-slate-300/20 dark:bg-slate-700/20 scale-95'
                        }`}
                />

                {/* Continuous radar ripple when holding */}
                {isHolding && (
                    <div
                        className={`absolute inset-0 rounded-full border-2 ${isCheckIn ? 'border-emerald-500/40' : 'border-amber-500/40'
                            } pointer-events-none`}
                        style={{ animation: 'scannerRipple 1.1s cubic-bezier(0, 0.2, 0.8, 1) infinite' }}
                    />
                )}

                {/* SVG Progress Ring */}
                <svg
                    className="absolute inset-0 -rotate-90 pointer-events-none"
                    width="100%"
                    height="100%"
                    viewBox="0 0 120 120"
                >
                    <defs>
                        <linearGradient id={theme.strokeGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={theme.gradientFrom} />
                            <stop offset="100%" stopColor={theme.gradientTo} />
                        </linearGradient>
                    </defs>

                    {/* Track */}
                    <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        className="text-slate-200/80 dark:text-slate-800/80 transition-colors"
                    />

                    {/* Active dynamic progress arc */}
                    <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        fill="none"
                        stroke={`url(#${theme.strokeGradientId})`}
                        strokeWidth={isHolding ? '5' : '4'}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        style={{
                            transition: isHolding ? 'stroke-dashoffset 60ms linear' : 'stroke-dashoffset 280ms ease-out',
                        }}
                    />
                </svg>

                {/* Tactile Sensor Pad Button */}
                <button
                    type="button"
                    tabIndex={0}
                    disabled={disabled || loading}
                    aria-label={`Hold fingerprint sensor to ${theme.buttonTitle}`}
                    onPointerDown={startHolding}
                    onPointerUp={cancelHolding}
                    onPointerLeave={cancelHolding}
                    onPointerCancel={cancelHolding}
                    onContextMenu={(e) => e.preventDefault()}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyUp}
                    className={`group relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full border-2 transition-all duration-300 outline-none focus-visible:ring-4 focus-visible:ring-offset-2 ${isVerified
                        ? 'border-emerald-400 bg-emerald-500/10 shadow-[0_0_35px_rgba(16,185,129,0.5)] scale-95 dark:bg-emerald-950/40'
                        : isHolding
                            ? `${theme.activeBorder} ${theme.activeGlow} scale-[0.96] bg-slate-100/90 dark:bg-slate-900/95`
                            : `${theme.idleBorder} bg-white/90 shadow-lg shadow-slate-200/60 hover:scale-[1.02] active:scale-95 dark:bg-slate-900/90 dark:shadow-black/50`
                        } ${disabled || loading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} touch-none`}
                    style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
                >
                    {/* Futuristic Corner Reticle Brackets */}
                    <span
                        className={`pointer-events-none absolute top-2 left-2 h-2 w-2 border-t-2 border-l-2 rounded-tl-[3px] transition-colors ${isHolding || isVerified ? theme.bracketBorder : 'border-slate-300 dark:border-slate-700'
                            }`}
                    />
                    <span
                        className={`pointer-events-none absolute top-2 right-2 h-2 w-2 border-t-2 border-r-2 rounded-tr-[3px] transition-colors ${isHolding || isVerified ? theme.bracketBorder : 'border-slate-300 dark:border-slate-700'
                            }`}
                    />
                    <span
                        className={`pointer-events-none absolute bottom-2 left-2 h-2 w-2 border-b-2 border-l-2 rounded-bl-[3px] transition-colors ${isHolding || isVerified ? theme.bracketBorder : 'border-slate-300 dark:border-slate-700'
                            }`}
                    />
                    <span
                        className={`pointer-events-none absolute bottom-2 right-2 h-2 w-2 border-b-2 border-r-2 rounded-br-[3px] transition-colors ${isHolding || isVerified ? theme.bracketBorder : 'border-slate-300 dark:border-slate-700'
                            }`}
                    />

                    {/* Laser Scanner Sweep Animation (Visible when holding) */}
                    {isHolding && !loading && !isVerified && (
                        <div className="pointer-events-none absolute inset-2 overflow-hidden rounded-full">
                            {/* Scanning Light Beam */}
                            <div
                                className={`absolute left-0 right-0 h-0.5 bg-gradient-to-r ${theme.laserBg} ${theme.laserShadow}`}
                                style={{
                                    animation: 'scanBeam 0.75s ease-in-out infinite',
                                }}
                            />
                            {/* Light trail */}
                            <div
                                className={`absolute inset-0 bg-gradient-to-b ${theme.sweepBg} opacity-60`}
                                style={{
                                    animation: 'scannerBreathing 0.75s ease-in-out infinite',
                                }}
                            />
                        </div>
                    )}

                    {/* Sensor Center Content */}
                    <div className="relative z-10 flex flex-col items-center justify-center">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center gap-1 text-indigo-600 dark:text-indigo-400">
                                <Loader2 className="h-7 w-7 animate-spin sm:h-8 sm:w-8" />
                                <span className="text-[9px] font-bold tracking-wider uppercase">Processing</span>
                            </div>
                        ) : isVerified ? (
                            <div className="flex flex-col items-center justify-center gap-0.5 text-emerald-500 animate-in zoom-in-75 duration-200">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/40">
                                    <Check className="h-5 w-5 stroke-[3]" />
                                </div>
                                <span className="text-[10px] font-extrabold tracking-wider uppercase text-emerald-600 dark:text-emerald-400">
                                    Verified
                                </span>
                            </div>
                        ) : (
                            <>
                                <Fingerprint
                                    className={`h-10 w-10 sm:h-12 sm:w-12 stroke-[1.65] transition-all duration-300 ${isHolding
                                        ? `${theme.iconActive} scale-110 drop-shadow-[0_0_10px_currentColor]`
                                        : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'
                                        }`}
                                />
                                {isHolding && (
                                    <span className="mt-0.5 font-mono text-[10px] font-bold tracking-wider text-slate-700 dark:text-slate-200">
                                        {Math.round(progress)}%
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                </button>
            </div>

            {/* Status & Instructional Captions */}
            <div className="mt-2.5 flex flex-col items-center text-center">
                {/* Main Action Badge */}
                <div
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition-all ${isVerified
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : theme.badgeBg
                        }`}
                >
                    <Sparkles className="h-3 w-3" />
                    <span>
                        {loading
                            ? `${theme.actionVerb}...`
                            : isVerified
                                ? 'Biometric Verified!'
                                : isHolding
                                    ? `Scanning Fingerprint (${Math.round(progress)}%)`
                                    : `Hold to ${theme.buttonTitle}`}
                    </span>
                </div>

                {/* Subtext Prompt */}
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    {loading ? (
                        'Synchronizing with attendance server...'
                    ) : hint ? (
                        <span className="font-semibold text-amber-600 dark:text-amber-400 animate-pulse">{hint}</span>
                    ) : isHolding ? (
                        'Keep holding until scan completes...'
                    ) : (
                        'Press & hold sensor for 1 second'
                    )}
                </p>
            </div>
        </div>
    );
}

