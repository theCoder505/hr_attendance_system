import { useEffect, useState } from 'react';

export type Appearance = 'light' | 'dark' | 'system';

const prefersDark = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const applyTheme = (appearance: Appearance) => {
    if (typeof document === 'undefined') return;
    const isDark = appearance === 'dark' || (appearance === 'system' && prefersDark());

    document.documentElement.classList.toggle('dark', isDark);
};

const handleSystemThemeChange = () => {
    if (typeof window === 'undefined') return;
    const currentAppearance = (localStorage.getItem('appearance') as Appearance) || 'system';
    applyTheme(currentAppearance);
};

export function initializeTheme() {
    if (typeof window === 'undefined') return;

    const savedAppearance = (localStorage.getItem('appearance') as Appearance) || 'system';
    applyTheme(savedAppearance);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleSystemThemeChange);
}

export function useAppearance() {
    const [appearance, setAppearance] = useState<Appearance>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('appearance') as Appearance) || 'system';
        }
        return 'system';
    });

    const updateAppearance = (mode: Appearance) => {
        setAppearance(mode);
        if (typeof window !== 'undefined') {
            localStorage.setItem('appearance', mode);
            applyTheme(mode);
            window.dispatchEvent(new CustomEvent('appearance-changed', { detail: mode }));
        }
    };

    useEffect(() => {
        const handleCustomChange = (e: Event) => {
            const customEvent = e as CustomEvent<Appearance>;
            if (customEvent.detail) {
                setAppearance(customEvent.detail);
            }
        };

        window.addEventListener('appearance-changed', handleCustomChange);
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', handleSystemThemeChange);

        return () => {
            window.removeEventListener('appearance-changed', handleCustomChange);
            mediaQuery.removeEventListener('change', handleSystemThemeChange);
        };
    }, []);

    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

    return { appearance, updateAppearance, isDark };
}
