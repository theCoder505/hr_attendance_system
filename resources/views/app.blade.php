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
        </script>
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
