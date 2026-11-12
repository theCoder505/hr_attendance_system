import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format minutes into a human-readable duration string.
 * Example: 278 -> "4h 38m", 60 -> "1h", 25 -> "25m", 0 -> "0m"
 */
export function formatMinutes(minutes: number | string | null | undefined): string {
    const mins = Math.max(0, Math.round(Number(minutes) || 0));
    if (mins === 0) return '0m';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) {
        return `${h}h ${m}m`;
    }
    if (h > 0) {
        return `${h}h`;
    }
    return `${m}m`;
}

/**
 * Format minutes into a standard HH:MM duration string (e.g. 90 -> "01:30", 480 -> "08:00", 0 -> "00:00").
 * Safely guards against negative numbers or undefined/null.
 */
export function formatMinutesToHHMM(totalMinutes: number | string | null | undefined): string {
    const mins = Math.max(0, Math.round(Number(totalMinutes) || 0));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Format minutes into H.MM hours string (e.g. 450 -> "7.30", 480 -> "8.00", 90 -> "1.30").
 * Shows hours and minutes separated by a dot, where minutes are zero-padded to 2 digits.
 */
export function formatMinutesToHoursDot(totalMinutes: number | string | null | undefined): string {
    const mins = Math.max(0, Math.round(Number(totalMinutes) || 0));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}.${String(m).padStart(2, '0')}`;
}

/**
 * Format a day number into ordinal string (e.g. 1 -> "1st", 2 -> "2nd", 3 -> "3rd", 7 -> "7th").
 */
export function getOrdinalDay(day: number | string): string {
    const d = parseInt(String(day), 10);
    if (isNaN(d)) return String(day);
    const j = d % 10;
    const k = d % 100;
    if (j === 1 && k !== 11) return `${d}st`;
    if (j === 2 && k !== 12) return `${d}2nd`;
    if (j === 3 && k !== 13) return `${d}3rd`;
    return `${d}th`;
}

/**
 * Format an invoice due date into human readable format showing the admin added due date.
 * E.g. "2026-11-07" -> "7th of November, 2026", or with day "7th of current month"
 */
export function formatHumanDueDate(dateStr: string | null | undefined, dueDay?: number): string {
    if (!dateStr) return 'N/A';
    try {
        const parts = String(dateStr).split('-');
        if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            const date = new Date(year, month, day);
            const monthName = date.toLocaleString('en-US', { month: 'long' });
            return `${getOrdinalDay(day)} of ${monthName}, ${year}`;
        }
    } catch {
        // fallback
    }
    return String(dateStr);
}

/**
 * Get current date string (YYYY-MM-DD) in a given timezone.
 * Defaults to the application timezone or user's local timezone.
 */
export function getTodayDateString(timeZone?: string): string {
    try {
        const tz = timeZone || 'Asia/Dhaka';
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: tz,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
        return formatter.format(new Date());
    } catch {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
}

