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

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        const initialFavicon = (props.initialPage.props as any)?.settings?.favicon;
        if (initialFavicon !== undefined) {
            updateDynamicFavicon(initialFavicon);
        }

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});

// Update dynamic favicon whenever Inertia navigation or mutation finishes successfully
router.on('success', (event) => {
    const favicon = (event.detail.page.props as any)?.settings?.favicon;
    if (favicon !== undefined) {
        updateDynamicFavicon(favicon);
    }
});

// This will set light / dark mode on load...
initializeTheme();
