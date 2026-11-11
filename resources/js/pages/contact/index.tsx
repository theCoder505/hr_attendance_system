import { useState, useEffect, useRef } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    Building2,
    Mail,
    Phone,
    Store,
    Users,
    Send,
    CheckCircle2,
    RefreshCw,
    ShieldCheck,
    ArrowLeft,
    Sparkles,
    MessageSquare,
    AlertCircle,
} from 'lucide-react';
import { showToast, showError, showSuccess } from '@/lib/swal';
import ThemeToggle from '@/components/theme-toggle';

interface Props {
    brandname: string;
    logo: string | null;
    verifiedEmail: string | null;
}

export default function ContactPage({ brandname, logo, verifiedEmail }: Props) {
    // Form fields
    const [companyName, setCompanyName] = useState('');
    const [subject, setSubject] = useState('');
    const [email, setEmail] = useState(verifiedEmail || '');
    const [phone, setPhone] = useState('');
    const [totalOutlets, setTotalOutlets] = useState<number>(1);
    const [avgEmployees, setAvgEmployees] = useState<number>(5);
    const [message, setMessage] = useState('');

    // OTP states
    const [isEmailVerified, setIsEmailVerified] = useState<boolean>(!!verifiedEmail);
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [verifyOtpLoading, setVerifyOtpLoading] = useState(false);
    const [resendCountdown, setResendCountdown] = useState(0);

    // Captcha states
    const [captchaCode, setCaptchaCode] = useState('');
    const [userCaptcha, setUserCaptcha] = useState('');
    const [isCaptchaValid, setIsCaptchaValid] = useState<boolean | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Submission state
    const [submitting, setSubmitting] = useState(false);
    const [submittedSuccess, setSubmittedSuccess] = useState(false);

    // Generate random captcha string (dummy string in JS)
    const generateCaptcha = () => {
        const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setCaptchaCode(code);
        setUserCaptcha('');
        setIsCaptchaValid(null);
    };

    // Draw captcha on canvas with distortion/lines
    useEffect(() => {
        generateCaptcha();
    }, []);

    useEffect(() => {
        if (!captchaCode || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background
        ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#1e293b' : '#f1f5f9';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Random decorative lines
        for (let i = 0; i < 4; i++) {
            ctx.strokeStyle = `rgba(99, 102, 241, ${Math.random() * 0.4 + 0.2})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.stroke();
        }

        // Draw letters
        ctx.font = 'bold 22px monospace';
        for (let i = 0; i < captchaCode.length; i++) {
            ctx.fillStyle = `hsl(${220 + i * 20}, 70%, ${document.documentElement.classList.contains('dark') ? '70%' : '35%'})`;
            const x = 16 + i * 20;
            const y = 26 + (Math.random() * 6 - 3);
            const angle = (Math.random() * 20 - 10) * (Math.PI / 180);
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.fillText(captchaCode[i], 0, 0);
            ctx.restore();
        }
    }, [captchaCode]);

    // Validate captcha on input change
    useEffect(() => {
        if (userCaptcha.length >= 6) {
            setIsCaptchaValid(userCaptcha.trim() === captchaCode);
        } else {
            setIsCaptchaValid(null);
        }
    }, [userCaptcha, captchaCode]);

    // Resend countdown timer
    useEffect(() => {
        if (resendCountdown > 0) {
            const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCountdown]);

    // Send OTP to email
    const handleSendOtp = async () => {
        if (!email || !email.includes('@')) {
            showError('Invalid Email', 'Please enter a valid email address first.');
            return;
        }

        setOtpLoading(true);
        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
            const res = await fetch('/contact/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken, 'X-XSRF-TOKEN': csrfToken } : {}),
                },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setOtpSent(true);
                setResendCountdown(60);
                showSuccess('OTP Sent!', data.message);
            } else {
                showError('Could not send OTP', data.message || 'Error occurred.');
            }
        } catch (e: any) {
            showError('Error', 'Unable to reach server to dispatch OTP.');
        } finally {
            setOtpLoading(false);
        }
    };

    // Verify OTP
    const handleVerifyOtp = async () => {
        if (!otpCode || otpCode.length !== 6) {
            showError('Invalid Code', 'Please enter the complete 6-digit OTP code.');
            return;
        }

        setVerifyOtpLoading(true);
        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
            const res = await fetch('/contact/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken, 'X-XSRF-TOKEN': csrfToken } : {}),
                },
                body: JSON.stringify({ email, otp: otpCode }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setIsEmailVerified(true);
                showToast('Email verified successfully!', 'success');
            } else {
                showError('Verification Failed', data.message || 'Invalid or expired OTP.');
            }
        } catch (e: any) {
            showError('Error', 'Verification request failed.');
        } finally {
            setVerifyOtpLoading(false);
        }
    };

    // Submit Contact Form
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isEmailVerified) {
            showError('Email Not Verified', 'Please verify your email address via OTP first.');
            return;
        }

        if (userCaptcha.trim() !== captchaCode) {
            showError('Invalid Captcha', 'Please enter the characters shown in the security verification box.');
            generateCaptcha();
            return;
        }

        setSubmitting(true);
        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
            const res = await fetch('/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken, 'X-XSRF-TOKEN': csrfToken } : {}),
                },
                body: JSON.stringify({
                    company_name: companyName,
                    subject,
                    email,
                    phone,
                    total_outlets: totalOutlets,
                    avg_employees_per_outlet: avgEmployees,
                    message,
                }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setSubmittedSuccess(true);
                showSuccess('Inquiry Submitted!', data.message);
            } else {
                showError('Submission Failed', data.message || 'Please check your inputs.');
            }
        } catch (e: any) {
            showError('Error', 'Failed to submit contact form.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col antialiased transition-colors selection:bg-indigo-500 selection:text-white">
            <Head title={`Contact & Inquiries - ${brandname}`} />

            {/* Glowing accents */}
            <div className="pointer-events-none absolute top-0 left-1/2 h-96 w-3/4 -translate-x-1/2 rounded-full bg-indigo-600/5 blur-3xl dark:bg-indigo-600/10" />

            {/* Header */}
            <header className="relative z-10 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-4 backdrop-blur-md sm:px-8 dark:border-slate-800/80 dark:bg-slate-900/80">
                <div className="flex items-center gap-3">
                    <Link href="/attendance" className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back to Portal</span>
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <ThemeToggle variant="dropdown" />
                    <Link
                        href="/store/login"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
                    >
                        <Store className="h-3.5 w-3.5" />
                        <span>Store Login</span>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:py-14">
                <div className="text-center max-w-2xl mx-auto mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-3">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Store Owners & Enterprise Onboarding</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        Expand Your Attendance Network
                    </h1>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        Interested in setting up multiple outlets and automated employee attendance for your company? Contact the platform administration owner below.
                    </p>
                </div>

                {submittedSuccess ? (
                    <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xl">
                        <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mb-5">
                            <CheckCircle2 className="h-10 w-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Inquiry Submitted Successfully!</h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                            Thank you for reaching out. Your store inquiry has been delivered directly to the Super Admin portal. Our team will review your requirements and send a response to <strong className="text-slate-900 dark:text-white">{email}</strong>.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <button
                                onClick={() => {
                                    setSubmittedSuccess(false);
                                    setCompanyName('');
                                    setSubject('');
                                    setMessage('');
                                    generateCaptcha();
                                }}
                                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                Submit Another Message
                            </button>
                            <Link
                                href="/attendance"
                                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all text-center"
                            >
                                Return to Homepage
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Step 1: Email & OTP Verification */}
                            <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/40 p-5 sm:p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">1</div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Email & Identity Verification</h3>
                                    </div>
                                    {isEmailVerified && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            Email Verified
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                                    <div className="sm:col-span-2 space-y-1">
                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                            <Mail className="h-3.5 w-3.5 text-indigo-500" />
                                            Store Owner Email Address <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            disabled={isEmailVerified || otpLoading}
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="owner@yourcompany.com"
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 disabled:opacity-75"
                                        />
                                    </div>
                                    <div>
                                        {!isEmailVerified ? (
                                            <button
                                                type="button"
                                                onClick={handleSendOtp}
                                                disabled={otpLoading || !email || resendCountdown > 0}
                                                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1.5 cursor-pointer"
                                            >
                                                {otpLoading ? (
                                                    <span>Sending OTP...</span>
                                                ) : resendCountdown > 0 ? (
                                                    <span>Resend in {resendCountdown}s</span>
                                                ) : (
                                                    <>
                                                        <ShieldCheck className="h-4 w-4" />
                                                        <span>{otpSent ? 'Resend OTP' : 'Send Email OTP'}</span>
                                                    </>
                                                )}
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsEmailVerified(false);
                                                    setOtpSent(false);
                                                    setOtpCode('');
                                                }}
                                                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                            >
                                                Change Email
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* OTP Input Box if sent and not yet verified */}
                                {otpSent && !isEmailVerified && (
                                    <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                                        <div className="relative w-full sm:w-60">
                                            <input
                                                type="text"
                                                maxLength={6}
                                                value={otpCode}
                                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                                placeholder="Enter 6-digit OTP"
                                                className="w-full px-3.5 py-2.5 font-mono text-center tracking-widest text-sm rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleVerifyOtp}
                                            disabled={verifyOtpLoading || otpCode.length !== 6}
                                            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                            <span>{verifyOtpLoading ? 'Verifying...' : 'Verify OTP'}</span>
                                        </button>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                            A 6-digit verification code was dispatched to your inbox.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Step 2: Company Details */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">2</div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Store & Company Information</h3>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                            <Building2 className="h-3.5 w-3.5 text-indigo-500" />
                                            Company / Store Name <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            placeholder="e.g. Apex Retail Stores Ltd."
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                            <Phone className="h-3.5 w-3.5 text-indigo-500" />
                                            Contact Phone <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="+8801**********"
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                            <Store className="h-3.5 w-3.5 text-indigo-500" />
                                            Total Outlets Needed <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={500}
                                            required
                                            value={totalOutlets}
                                            onChange={(e) => setTotalOutlets(parseInt(e.target.value) || 1)}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                            <Users className="h-3.5 w-3.5 text-indigo-500" />
                                            Average Employees per Outlet <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={5000}
                                            required
                                            value={avgEmployees}
                                            onChange={(e) => setAvgEmployees(parseInt(e.target.value) || 1)}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Subject <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="e.g. Request to onboard 5 retail branches"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                        <MessageSquare className="h-3.5 w-3.5 text-indigo-500" />
                                        Inquiry Message & Requirements <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        rows={4}
                                        required
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Describe your current store setup, locations, preferred office hours, and any custom requirements..."
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 resize-y"
                                    />
                                </div>
                            </div>

                            {/* Step 3: Frontend JS Captcha */}
                            <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/40 p-5 space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">3</div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Security Captcha Verification</h3>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Please enter the verification string displayed in the security canvas below.
                                </p>

                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    {/* Captcha Canvas */}
                                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm">
                                        <canvas ref={canvasRef} width={150} height={38} className="rounded-lg select-none" />
                                        <button
                                            type="button"
                                            onClick={generateCaptcha}
                                            title="Regenerate Captcha"
                                            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                        >
                                            <RefreshCw className="h-4 w-4" />
                                        </button>
                                    </div>

                                    {/* Captcha Input */}
                                    <div className="w-full sm:w-48 relative">
                                        <input
                                            type="text"
                                            maxLength={6}
                                            required
                                            value={userCaptcha}
                                            onChange={(e) => setUserCaptcha(e.target.value)}
                                            placeholder="Type code"
                                            className="w-full px-3.5 py-2 font-mono uppercase tracking-wider text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                        />
                                        {isCaptchaValid === true && (
                                            <CheckCircle2 className="absolute right-3 top-2.5 h-4 w-4 text-emerald-500" />
                                        )}
                                        {isCaptchaValid === false && (
                                            <AlertCircle className="absolute right-3 top-2.5 h-4 w-4 text-rose-500" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={submitting || !isEmailVerified || isCaptchaValid !== true}
                                    className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {submitting ? (
                                        <span>Submitting Inquiry...</span>
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4" />
                                            <span>Send Store Inquiry to Super Admin</span>
                                        </>
                                    )}
                                </button>
                                {!isEmailVerified && (
                                    <p className="text-center text-[11px] text-amber-600 dark:text-amber-400 mt-2">
                                        * Please complete Email OTP verification in Step 1 before submitting.
                                    </p>
                                )}
                            </div>
                        </form>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-slate-200 px-4 py-6 text-center text-xs text-slate-500 dark:border-slate-800/80">
                <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        &copy; {new Date().getFullYear()} {brandname}. Platform Onboarding Portal.
                    </div>
                    <div className="flex items-center gap-6">
                        <Link href="/attendance" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                            Attendance Portal
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}

