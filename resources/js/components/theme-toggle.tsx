import React from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useAppearance, Appearance } from '@/hooks/use-appearance';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface ThemeToggleProps {
    variant?: 'button' | 'dropdown';
    className?: string;
}

export default function ThemeToggle({ variant = 'button', className = '' }: ThemeToggleProps) {
    const { appearance, updateAppearance, isDark } = useAppearance();

    const handleToggle = () => {
        // Simple 1-click toggle: if currently dark (or system-resolved dark), switch to light, else dark
        updateAppearance(isDark ? 'light' : 'dark');
    };

    if (variant === 'dropdown') {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        aria-label="Toggle theme"
                        className={`inline-flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm cursor-pointer ${className}`}
                    >
                        {isDark ? (
                            <Sun className="h-4 w-4 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
                        ) : (
                            <Moon className="h-4 w-4 text-indigo-600 transition-transform duration-300 rotate-0 hover:-rotate-12" />
                        )}
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-xl rounded-xl p-1 z-50">
                    <DropdownMenuItem
                        onClick={() => updateAppearance('light')}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                            appearance === 'light'
                                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                    >
                        <span className="flex items-center gap-2">
                            <Sun className="h-4 w-4 text-amber-500" />
                            Light
                        </span>
                        {appearance === 'light' && <Check className="h-3.5 w-3.5" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => updateAppearance('dark')}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                            appearance === 'dark'
                                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                    >
                        <span className="flex items-center gap-2">
                            <Moon className="h-4 w-4 text-indigo-400" />
                            Dark
                        </span>
                        {appearance === 'dark' && <Check className="h-3.5 w-3.5" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => updateAppearance('system')}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                            appearance === 'system'
                                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                    >
                        <span className="flex items-center gap-2">
                            <Monitor className="h-4 w-4 text-slate-400" />
                            System
                        </span>
                        {appearance === 'system' && <Check className="h-3.5 w-3.5" />}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    // Default: 1-click toggle button
    return (
        <button
            type="button"
            onClick={handleToggle}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className={`inline-flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm cursor-pointer group ${className}`}
        >
            {isDark ? (
                <Sun className="h-4 w-4 text-amber-400 group-hover:rotate-45 group-hover:scale-110 transition-transform duration-300" />
            ) : (
                <Moon className="h-4 w-4 text-slate-700 group-hover:-rotate-12 group-hover:scale-110 transition-transform duration-300" />
            )}
        </button>
    );
}
