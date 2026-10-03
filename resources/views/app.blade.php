<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        @php
            $settings = \App\Models\WebsiteSetting::current();
            $faviconUrl = !empty($settings->favicon)
                ? asset('storage/' . $settings->favicon)
                : asset('favicon.ico');
            $faviconExt = !empty($settings->favicon)
                ? strtolower(pathinfo($settings->favicon, PATHINFO_EXTENSION))
                : 'ico';
            $faviconMime = match($faviconExt) {
                'png' => 'image/png',
                'svg' => 'image/svg+xml',
                'jpg', 'jpeg' => 'image/jpeg',
                'webp' => 'image/webp',
                'gif' => 'image/gif',
                default => 'image/x-icon',
            };
        @endphp
        <link rel="icon" type="{{ $faviconMime }}" href="{{ $faviconUrl }}" id="dynamic-favicon">
        <link rel="apple-touch-icon" href="{{ $faviconUrl }}">
        <link rel="manifest" href="{{ url('/manifest.json') }}">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="default">
        <meta name="apple-mobile-web-app-title" content="{{ $settings->brandname ?? config('app.name', 'AttendEase Pro') }}">
        <meta name="theme-color" content="#4f46e5">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead

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

            if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
            }
        </script>
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>