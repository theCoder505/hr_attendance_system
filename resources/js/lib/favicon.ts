/**
 * Updates the browser's dynamic favicon and touch icon.
 * Fallback to /favicon.ico when no custom favicon is configured.
 */
export function updateDynamicFavicon(faviconPath?: string | null): void {
    if (typeof document === 'undefined') {
        return;
    }

    const faviconUrl = faviconPath ? `/storage/${faviconPath}` : '/favicon.ico';

    let iconLink = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!iconLink) {
        iconLink = document.createElement('link');
        iconLink.rel = 'icon';
        document.head.appendChild(iconLink);
    }

    if (faviconPath) {
        const ext = faviconPath.split('.').pop()?.toLowerCase();
        const mimeTypes: Record<string, string> = {
            png: 'image/png',
            svg: 'image/svg+xml',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            webp: 'image/webp',
            gif: 'image/gif',
            ico: 'image/x-icon',
        };
        if (ext && mimeTypes[ext]) {
            iconLink.type = mimeTypes[ext];
        }
    } else {
        iconLink.type = 'image/x-icon';
    }

    iconLink.href = faviconUrl;

    // Synchronize apple-touch-icon
    let appleLink = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
    if (!appleLink) {
        appleLink = document.createElement('link');
        appleLink.rel = 'apple-touch-icon';
        document.head.appendChild(appleLink);
    }
    appleLink.href = faviconUrl;
}
