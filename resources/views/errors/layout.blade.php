<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    @php
        $settings = \App\Models\WebsiteSetting::current();
        $brandname = $settings->brandname ?? config('app.name', 'AttendEase Pro');
        $faviconUrl = !empty($settings->favicon) ? asset('storage/' . $settings->favicon) : asset('favicon.ico');
        $logoUrl = !empty($settings->logo) ? asset('storage/' . $settings->logo) : null;
    @endphp
    <title>@yield('title') | {{ $brandname }}</title>
    <link rel="icon" href="{{ $faviconUrl }}">
    <link rel="apple-touch-icon" href="{{ $faviconUrl }}">
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700" rel="stylesheet" />
    <script>
        (function() {
            try {
                const appearance = localStorage.getItem('appearance') || 'system';
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (appearance === 'dark' || (appearance === 'system' && prefersDark)) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            } catch (e) {}
        })();
    </script>
    <style>
        *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        :root {
            --bg-color: #f8fafc;
            --text-color: #0f172a;
            --muted-color: #64748b;
            --card-bg: #ffffff;
            --card-border: #e2e8f0;
            --badge-bg: #f1f5f9;
            --badge-border: #e2e8f0;
            --badge-text: #475569;
            --code-gradient-from: #4f46e5;
            --code-gradient-to: #9333ea;
            --btn-primary-bg: #4f46e5;
            --btn-primary-hover: #4338ca;
            --btn-primary-text: #ffffff;
            --btn-secondary-bg: #ffffff;
            --btn-secondary-border: #cbd5e1;
            --btn-secondary-hover: #f1f5f9;
            --btn-secondary-text: #334155;
            --shadow-card: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
            --icon-bg: rgba(79, 70, 229, 0.1);
            --icon-color: #4f46e5;
        }
        .dark {
            --bg-color: #090d16;
            --text-color: #f8fafc;
            --muted-color: #94a3b8;
            --card-bg: #0f172a;
            --card-border: #1e293b;
            --badge-bg: #1e293b;
            --badge-border: #334155;
            --badge-text: #cbd5e1;
            --code-gradient-from: #818cf8;
            --code-gradient-to: #c084fc;
            --btn-primary-bg: #6366f1;
            --btn-primary-hover: #4f46e5;
            --btn-primary-text: #ffffff;
            --btn-secondary-bg: #1e293b;
            --btn-secondary-border: #334155;
            --btn-secondary-hover: #334155;
            --btn-secondary-text: #e2e8f0;
            --shadow-card: 0 25px 30px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3);
            --icon-bg: rgba(99, 102, 241, 0.15);
            --icon-color: #818cf8;
        }
        body {
            font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-color);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 24px 16px;
            position: relative;
            overflow-x: hidden;
            transition: background-color 0.2s ease, color 0.2s ease;
        }
        /* Background decorative glow */
        .glow-1 {
            position: absolute;
            top: 15%;
            left: 20%;
            width: 400px;
            height: 400px;
            background: radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(99, 102, 241, 0) 70%);
            border-radius: 50%;
            filter: blur(40px);
            pointer-events: none;
            z-index: 0;
        }
        .glow-2 {
            position: absolute;
            bottom: 15%;
            right: 20%;
            width: 350px;
            height: 350px;
            background: radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, rgba(168, 85, 247, 0) 70%);
            border-radius: 50%;
            filter: blur(40px);
            pointer-events: none;
            z-index: 0;
        }
        .error-container {
            position: relative;
            z-index: 10;
            width: 100%;
            max-width: 540px;
            text-align: center;
        }
        .brand-header {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 28px;
            text-decoration: none;
            color: var(--text-color);
        }
        .brand-logo {
            max-height: 36px;
            width: auto;
            max-width: 180px;
            object-contain: contain;
        }
        .dark .brand-logo {
            filter: invert(1) brightness(0.9);
        }
        .brand-fallback {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 18px;
            font-weight: 700;
            letter-spacing: -0.02em;
        }
        .brand-icon {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            background: #4f46e5;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .card {
            background-color: var(--card-bg);
            border: 1px solid var(--card-border);
            border-radius: 24px;
            padding: 44px 32px;
            box-shadow: var(--shadow-card);
            backdrop-filter: blur(8px);
            transition: all 0.3s ease;
        }
        @media (max-width: 640px) {
            .card {
                padding: 32px 20px;
            }
        }
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 5px 12px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            background-color: var(--badge-bg);
            border: 1px solid var(--badge-border);
            color: var(--badge-text);
            margin-bottom: 20px;
        }
        .code-display {
            font-size: 80px;
            font-weight: 800;
            line-height: 1;
            letter-spacing: -0.04em;
            margin-bottom: 12px;
            background: linear-gradient(135deg, var(--code-gradient-from), var(--code-gradient-to));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .icon-circle {
            width: 68px;
            height: 68px;
            border-radius: 20px;
            background-color: var(--icon-bg);
            color: var(--icon-color);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
        }
        .icon-circle svg {
            width: 34px;
            height: 34px;
        }
        h1 {
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.02em;
            margin-bottom: 12px;
            color: var(--text-color);
        }
        p {
            font-size: 15px;
            line-height: 1.6;
            color: var(--muted-color);
            margin-bottom: 32px;
            max-width: 440px;
            margin-left: auto;
            margin-right: auto;
        }
        .btn-group {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            flex-wrap: wrap;
        }
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 11px 22px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            transition: all 0.2s ease;
            outline: none;
            border: none;
        }
        .btn-primary {
            background-color: var(--btn-primary-bg);
            color: var(--btn-primary-text);
            box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);
        }
        .btn-primary:hover {
            background-color: var(--btn-primary-hover);
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
        }
        .btn-secondary {
            background-color: var(--btn-secondary-bg);
            border: 1px solid var(--btn-secondary-border);
            color: var(--btn-secondary-text);
        }
        .btn-secondary:hover {
            background-color: var(--btn-secondary-hover);
            transform: translateY(-1px);
        }
        .footer-note {
            margin-top: 24px;
            font-size: 13px;
            color: var(--muted-color);
        }
        .footer-note a {
            color: var(--btn-primary-bg);
            text-decoration: none;
            font-weight: 500;
        }
        .footer-note a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="glow-1"></div>
    <div class="glow-2"></div>

    <div class="error-container">
        <!-- Logo / Brand on top -->
        <a href="/" class="brand-header">
            @if ($logoUrl)
                <img src="{{ $logoUrl }}" alt="{{ $brandname }}" class="brand-logo">
            @else
                <div class="brand-fallback">
                    <div class="brand-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                    </div>
                    <span>{{ $brandname }}</span>
                </div>
            @endif
        </a>

        <!-- Main Error Card -->
        <div class="card">
            @hasSection('icon')
                <div class="icon-circle">
                    @yield('icon')
                </div>
            @endif

            <div>
                <div class="badge">
                    @yield('badge', 'Error ' . $__env->yieldContent('code'))
                </div>
            </div>

            <div class="code-display">@yield('code')</div>

            <h1>@yield('heading')</h1>

            <p>@yield('message')</p>

            <div class="btn-group">
                @hasSection('actions')
                    @yield('actions')
                @else
                    <button type="button" onclick="window.history.back()" class="btn btn-secondary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m15 18-6-6 6-6"/>
                        </svg>
                        Go Back
                    </button>
                    <a href="/" class="btn btn-primary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                            <polyline points="9 22 9 12 15 12 15 22"/>
                        </svg>
                        Return Home
                    </a>
                @endif
            </div>
        </div>

        <div class="footer-note">
            Need assistance? <a href="/#contact">Contact Support</a> or check the <a href="/attendance">Employee Portal</a>.
        </div>
    </div>
</body>
</html>

