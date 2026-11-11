import '../css/app.css';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { route as routeFn } from 'ziggy-js';
import { initializeTheme } from './hooks/use-appearance';
import { updateDynamicFavicon } from './lib/favicon';

declare global {
    const route: typeof routeFn;
}

let dynamicBrandname =
    typeof document !== 'undefined'
        ? (document.querySelector('meta[name="app-brandname"]') as HTMLMetaElement)?.content ||
          document.title ||
          'Attendance'
        : 'Attendance';

createInertiaApp({
    title: (title) => {
        const brand = dynamicBrandname || 'Attendance';
        if (!title) return brand;
        if (title === brand || title.endsWith(`- ${brand}`) || title.includes(brand)) return title;
        return `${title} - ${brand}`;
    },
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        const pageProps = props.initialPage.props as any;
        const initialBrand = pageProps?.settings?.brandname || pageProps?.name;
        if (initialBrand) {
            dynamicBrandname = initialBrand;
        }

        const initialFavicon = pageProps?.settings?.favicon;
        const initialVersion = pageProps?.settings?.updated_at;
        if (initialFavicon !== undefined) {
            updateDynamicFavicon(initialFavicon, initialVersion);
        }

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});

// Update dynamic favicon & brandname whenever Inertia navigation or mutation finishes successfully
router.on('success', (event) => {
    const pageProps = event.detail.page.props as any;
    const newBrand = pageProps?.settings?.brandname || pageProps?.name;
    if (newBrand) {
        dynamicBrandname = newBrand;
        const meta = document.querySelector('meta[name="app-brandname"]') as HTMLMetaElement;
        if (meta) meta.content = newBrand;
    }

    const favicon = pageProps?.settings?.favicon;
    const version = pageProps?.settings?.updated_at;
    if (favicon !== undefined) {
        updateDynamicFavicon(favicon, version);
    }
});

// This will set light / dark mode on load...
initializeTheme();
