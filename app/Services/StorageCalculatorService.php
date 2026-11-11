<?php

namespace App\Services;

use App\Models\Admin;
use App\Models\PlatformSetting;
use App\Models\WebsiteSetting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class StorageCalculatorService
{
    /**
     * Format raw bytes into human-readable representation.
     */
    public static function formatBytes(int|float $bytes, int $decimals = 2): string
    {
        if ($bytes < 0) {
            $bytes = 0;
        }

        if ($bytes < 1024) {
            return $bytes . ' B';
        }
        if ($bytes < 1048576) {
            return round($bytes / 1024, $decimals) . ' KB';
        }
        if ($bytes < 1073741824) {
            return round($bytes / 1048576, $decimals) . ' MB';
        }

        return round($bytes / 1073741824, $decimals) . ' GB';
    }

    /**
     * Get detailed storage usage breakdown for a specific store/admin.
     *
     * @return array{
     *     media_bytes: int,
     *     media_formatted: string,
     *     media_files_count: int,
     *     attendance_bytes: int,
     *     attendance_formatted: string,
     *     attendance_count: int,
     *     db_bytes: int,
     *     db_formatted: string,
     *     db_records_count: int,
     *     total_bytes: int,
     *     total_formatted: string,
     *     max_storage_mb: int,
     *     max_storage_bytes: int,
     *     max_storage_formatted: string,
     *     remaining_bytes: int,
     *     remaining_formatted: string,
     *     used_percentage: float,
     *     is_limit_reached: bool,
     *     chart_slices: array
     * }
     */
    public static function getStoreStorageDetails(Admin $admin): array
    {
        $disk = Storage::disk('public');
        $mediaBytes = 0;
        $mediaFilesCount = 0;

        // 1. Employee Images & Appointment Letters
        $employees = $admin->employees()->select('id', 'image', 'appointment_letter')->get();
        foreach ($employees as $emp) {
            if ($emp->image && $disk->exists($emp->image)) {
                $mediaBytes += (int) $disk->size($emp->image);
                $mediaFilesCount++;
            }
            if ($emp->appointment_letter && $disk->exists($emp->appointment_letter)) {
                $mediaBytes += (int) $disk->size($emp->appointment_letter);
                $mediaFilesCount++;
            }
        }

        // 2. Store Settings Media (Logo & Favicon)
        $storeSetting = $admin->setting;
        if ($storeSetting) {
            if ($storeSetting->logo && $disk->exists($storeSetting->logo)) {
                $mediaBytes += (int) $disk->size($storeSetting->logo);
                $mediaFilesCount++;
            }
            if ($storeSetting->favicon && $disk->exists($storeSetting->favicon)) {
                $mediaBytes += (int) $disk->size($storeSetting->favicon);
                $mediaFilesCount++;
            }
        }

        // 3. Attendance database data calculation
        $attendanceRow = DB::table('attendances')
            ->where('admin_id', $admin->id)
            ->selectRaw('COUNT(*) as total_count, COALESCE(SUM(LENGTH(id) + LENGTH(admin_id) + LENGTH(employee_id) + LENGTH(COALESCE(outlet_id, 0)) + LENGTH(date) + LENGTH(COALESCE(check_in_at, "")) + LENGTH(COALESCE(check_out_at, "")) + LENGTH(COALESCE(late_minutes, 0)) + LENGTH(COALESCE(early_leave_minutes, 0)) + LENGTH(COALESCE(overtime_minutes, 0)) + LENGTH(COALESCE(is_manual, 0)) + 80), 0) as total_bytes')
            ->first();

        $attendanceBytes = (int) ($attendanceRow->total_bytes ?? 0);
        $attendanceCount = (int) ($attendanceRow->total_count ?? 0);

        // 4. Other Database records (Employees, Outlets, Invoices, Settings, Admin)
        $dbBytes = 0;
        $dbRecordsCount = 0;

        // Employees table
        $empRow = DB::table('employees')
            ->where('admin_id', $admin->id)
            ->selectRaw('COUNT(*) as total_count, COALESCE(SUM(LENGTH(id) + LENGTH(admin_id) + LENGTH(COALESCE(outlet_id, 0)) + LENGTH(uid) + LENGTH(name) + LENGTH(phone) + LENGTH(role) + LENGTH(COALESCE(work_desc, "")) + LENGTH(salary) + LENGTH(working_hours) + LENGTH(check_in_time) + LENGTH(check_out_time) + LENGTH(joining_date) + LENGTH(COALESCE(image, "")) + LENGTH(COALESCE(appointment_letter, "")) + LENGTH(status) + LENGTH(COALESCE(device_token_hash, "")) + LENGTH(COALESCE(verification_token, "")) + 128), 0) as total_bytes')
            ->first();
        $dbBytes += (int) ($empRow->total_bytes ?? 0);
        $dbRecordsCount += (int) ($empRow->total_count ?? 0);

        // Outlets table
        $outletRow = DB::table('outlets')
            ->where('admin_id', $admin->id)
            ->selectRaw('COUNT(*) as total_count, COALESCE(SUM(LENGTH(id) + LENGTH(admin_id) + LENGTH(uid) + LENGTH(name) + LENGTH(wifi_ip) + 64), 0) as total_bytes')
            ->first();
        $dbBytes += (int) ($outletRow->total_bytes ?? 0);
        $dbRecordsCount += (int) ($outletRow->total_count ?? 0);

        // Store Invoices table
        $invoiceRow = DB::table('store_invoices')
            ->where('admin_id', $admin->id)
            ->selectRaw('COUNT(*) as total_count, COALESCE(SUM(LENGTH(id) + LENGTH(admin_id) + LENGTH(invoice_number) + LENGTH(billing_month) + LENGTH(amount) + LENGTH(COALESCE(paid_amount, 0)) + LENGTH(status) + LENGTH(COALESCE(payment_method, "")) + LENGTH(COALESCE(transaction_id, "")) + LENGTH(COALESCE(payment_note, "")) + LENGTH(COALESCE(rejection_reason, "")) + 96), 0) as total_bytes')
            ->first();
        $dbBytes += (int) ($invoiceRow->total_bytes ?? 0);
        $dbRecordsCount += (int) ($invoiceRow->total_count ?? 0);

        // Store Settings table
        $settingRow = DB::table('website_settings')
            ->where('admin_id', $admin->id)
            ->selectRaw('COUNT(*) as total_count, COALESCE(SUM(LENGTH(id) + LENGTH(admin_id) + LENGTH(COALESCE(brandname, "")) + LENGTH(COALESCE(logo, "")) + LENGTH(COALESCE(favicon, "")) + LENGTH(COALESCE(office_starting_time, "")) + LENGTH(COALESCE(office_closing_time, "")) + LENGTH(COALESCE(office_ipv4_addr, "")) + 128), 0) as total_bytes')
            ->first();
        $dbBytes += (int) ($settingRow->total_bytes ?? 0);
        $dbRecordsCount += (int) ($settingRow->total_count ?? 0);

        // Admin's own row
        $adminRow = DB::table('admins')
            ->where('id', $admin->id)
            ->selectRaw('COUNT(*) as total_count, COALESCE(SUM(LENGTH(id) + LENGTH(COALESCE(uid, "")) + LENGTH(COALESCE(store_id, "")) + LENGTH(name) + LENGTH(email) + LENGTH(password) + 128), 0) as total_bytes')
            ->first();
        $dbBytes += (int) ($adminRow->total_bytes ?? 0);
        $dbRecordsCount += (int) ($adminRow->total_count ?? 0);

        // Total data used by this store
        $totalBytes = $mediaBytes + $attendanceBytes + $dbBytes;

        // Quota calculations
        $maxStorageMb = (int) ($admin->max_storage_mb ?: 500);
        $maxStorageBytes = $maxStorageMb * 1024 * 1024;
        $remainingBytes = max(0, $maxStorageBytes - $totalBytes);
        $usedPercentage = $maxStorageBytes > 0 ? min(100, round(($totalBytes / $maxStorageBytes) * 100, 2)) : 0;
        $isLimitReached = $totalBytes >= $maxStorageBytes;

        // Prepare slices for Pie Chart (Used categories + Remaining Free Space)
        $chartSlices = [
            [
                'id' => 'media',
                'label' => 'Images & Files',
                'bytes' => $mediaBytes,
                'formatted' => self::formatBytes($mediaBytes),
                'percentage' => $maxStorageBytes > 0 ? round(($mediaBytes / $maxStorageBytes) * 100, 2) : 0,
                'color' => '#8b5cf6', // Purple
                'count' => $mediaFilesCount,
                'unit' => 'files',
            ],
            [
                'id' => 'attendance',
                'label' => 'Attendance Logs',
                'bytes' => $attendanceBytes,
                'formatted' => self::formatBytes($attendanceBytes),
                'percentage' => $maxStorageBytes > 0 ? round(($attendanceBytes / $maxStorageBytes) * 100, 2) : 0,
                'color' => '#3b82f6', // Blue
                'count' => $attendanceCount,
                'unit' => 'records',
            ],
            [
                'id' => 'database',
                'label' => 'Database Records',
                'bytes' => $dbBytes,
                'formatted' => self::formatBytes($dbBytes),
                'percentage' => $maxStorageBytes > 0 ? round(($dbBytes / $maxStorageBytes) * 100, 2) : 0,
                'color' => '#10b981', // Emerald
                'count' => $dbRecordsCount,
                'unit' => 'records',
            ],
            [
                'id' => 'available',
                'label' => 'Available Free Space',
                'bytes' => $remainingBytes,
                'formatted' => self::formatBytes($remainingBytes),
                'percentage' => $maxStorageBytes > 0 ? max(0, round(100 - $usedPercentage, 2)) : 0,
                'color' => '#e2e8f0', // Slate / Gray
                'count' => null,
                'unit' => null,
            ],
        ];

        return [
            'media_bytes' => $mediaBytes,
            'media_formatted' => self::formatBytes($mediaBytes),
            'media_files_count' => $mediaFilesCount,
            'attendance_bytes' => $attendanceBytes,
            'attendance_formatted' => self::formatBytes($attendanceBytes),
            'attendance_count' => $attendanceCount,
            'db_bytes' => $dbBytes,
            'db_formatted' => self::formatBytes($dbBytes),
            'db_records_count' => $dbRecordsCount,
            'total_bytes' => $totalBytes,
            'total_formatted' => self::formatBytes($totalBytes),
            'max_storage_mb' => $maxStorageMb,
            'max_storage_bytes' => $maxStorageBytes,
            'max_storage_formatted' => self::formatBytes($maxStorageBytes),
            'remaining_bytes' => $remainingBytes,
            'remaining_formatted' => self::formatBytes($remainingBytes),
            'used_percentage' => $usedPercentage,
            'is_limit_reached' => $isLimitReached,
            'chart_slices' => $chartSlices,
        ];
    }

    /**
     * Get platform storage analytics for Super Admin Dashboard.
     * Includes Users Data + System Data (Website total files: node_modules + vendor + all folders/files + core DB) + Total Platform Data.
     */
    public static function getPlatformStorageDetails(bool $forceRefresh = false): array
    {
        if ($forceRefresh) {
            Cache::forget('platform_system_website_files_breakdown');
        }

        // 1. Users data (aggregate of all stores)
        $stores = Admin::all();
        $usersMediaBytes = 0;
        $usersAttendanceBytes = 0;
        $usersDbBytes = 0;
        $usersFilesCount = 0;
        $usersAttendanceCount = 0;
        $usersDbRecordsCount = 0;

        foreach ($stores as $store) {
            $details = self::getStoreStorageDetails($store);
            $usersMediaBytes += $details['media_bytes'];
            $usersAttendanceBytes += $details['attendance_bytes'];
            $usersDbBytes += $details['db_bytes'];
            $usersFilesCount += $details['media_files_count'];
            $usersAttendanceCount += $details['attendance_count'];
            $usersDbRecordsCount += $details['db_records_count'];
        }

        $usersTotalBytes = $usersMediaBytes + $usersAttendanceBytes + $usersDbBytes;

        // 2. System data calculation:
        // Website TOTAL file size on disk (node_modules + vendor + app + public + storage + all project directories/files)
        // Cached for 10 minutes to ensure lightning-fast dashboard performance
        $websiteFiles = Cache::remember('platform_system_website_files_breakdown', 600, function () {
            return self::getEntireProjectSize();
        });

        $systemFilesBytes = (int) ($websiteFiles['total_bytes'] ?? 0);
        $nodeModulesBytes = (int) ($websiteFiles['node_modules_bytes'] ?? 0);
        $vendorBytes = (int) ($websiteFiles['vendor_bytes'] ?? 0);
        $otherProjectFilesBytes = (int) ($websiteFiles['other_bytes'] ?? 0);

        // System database data:
        // Core system tables: super_admins, platform_settings, contact_inquiries, website_settings(admin_id=null), sessions, migrations
        $systemDbBytes = 0;
        $systemDbRecordsCount = 0;

        // super_admins
        $saRow = DB::table('super_admins')->selectRaw('COUNT(*) as total_count, COALESCE(SUM(LENGTH(id) + LENGTH(name) + LENGTH(email) + LENGTH(password) + 128), 0) as total_bytes')->first();
        $systemDbBytes += (int) ($saRow->total_bytes ?? 0);
        $systemDbRecordsCount += (int) ($saRow->total_count ?? 0);

        // platform_settings
        $psRow = DB::table('platform_settings')->selectRaw('COUNT(*) as total_count, COALESCE(SUM(LENGTH(id) + LENGTH(COALESCE(bkash_number, "")) + LENGTH(COALESCE(nagad_number, "")) + LENGTH(COALESCE(bank_name, "")) + LENGTH(COALESCE(user_manual_content, "")) + 256), 0) as total_bytes')->first();
        $systemDbBytes += (int) ($psRow->total_bytes ?? 0);
        $systemDbRecordsCount += (int) ($psRow->total_count ?? 0);

        // contact_inquiries
        $ciRow = DB::table('contact_inquiries')->selectRaw('COUNT(*) as total_count, COALESCE(SUM(LENGTH(id) + LENGTH(company_name) + LENGTH(subject) + LENGTH(email) + LENGTH(phone) + LENGTH(message) + LENGTH(COALESCE(reply_message, "")) + 128), 0) as total_bytes')->first();
        $systemDbBytes += (int) ($ciRow->total_bytes ?? 0);
        $systemDbRecordsCount += (int) ($ciRow->total_count ?? 0);

        // Global website_settings (admin_id is null)
        $wsRow = DB::table('website_settings')->whereNull('admin_id')->selectRaw('COUNT(*) as total_count, COALESCE(SUM(LENGTH(id) + LENGTH(COALESCE(brandname, "")) + LENGTH(COALESCE(logo, "")) + LENGTH(COALESCE(favicon, "")) + 128), 0) as total_bytes')->first();
        $systemDbBytes += (int) ($wsRow->total_bytes ?? 0);
        $systemDbRecordsCount += (int) ($wsRow->total_count ?? 0);

        // Other internal tables: migrations, sessions
        if (DB::getSchemaBuilder()->hasTable('sessions')) {
            $sessRow = DB::table('sessions')->selectRaw('COUNT(*) as total_count, COALESCE(SUM(LENGTH(id) + LENGTH(COALESCE(payload, "")) + 64), 0) as total_bytes')->first();
            $systemDbBytes += (int) ($sessRow->total_bytes ?? 0);
            $systemDbRecordsCount += (int) ($sessRow->total_count ?? 0);
        }
        if (DB::getSchemaBuilder()->hasTable('migrations')) {
            $migRow = DB::table('migrations')->selectRaw('COUNT(*) as total_count, COALESCE(SUM(LENGTH(id) + LENGTH(migration) + 32), 0) as total_bytes')->first();
            $systemDbBytes += (int) ($migRow->total_bytes ?? 0);
            $systemDbRecordsCount += (int) ($migRow->total_count ?? 0);
        }

        $systemTotalBytes = $systemFilesBytes + $systemDbBytes;
        $totalPlatformBytes = $usersTotalBytes + $systemTotalBytes;

        $usersPercentage = $totalPlatformBytes > 0 ? round(($usersTotalBytes / $totalPlatformBytes) * 100, 2) : 0;
        $systemPercentage = $totalPlatformBytes > 0 ? round(($systemTotalBytes / $totalPlatformBytes) * 100, 2) : 0;

        return [
            // Users Data
            'users_data' => [
                'total_bytes' => $usersTotalBytes,
                'total_formatted' => self::formatBytes($usersTotalBytes),
                'media_bytes' => $usersMediaBytes,
                'media_formatted' => self::formatBytes($usersMediaBytes),
                'media_files_count' => $usersFilesCount,
                'attendance_bytes' => $usersAttendanceBytes,
                'attendance_formatted' => self::formatBytes($usersAttendanceBytes),
                'attendance_count' => $usersAttendanceCount,
                'db_bytes' => $usersDbBytes,
                'db_formatted' => self::formatBytes($usersDbBytes),
                'db_records_count' => $usersDbRecordsCount,
                'percentage_of_platform' => $usersPercentage,
            ],
            // System Data (Total Website Files including node_modules + vendor + all project folders/files + core DB)
            'system_data' => [
                'total_bytes' => $systemTotalBytes,
                'total_formatted' => self::formatBytes($systemTotalBytes),
                'files_bytes' => $systemFilesBytes,
                'files_formatted' => self::formatBytes($systemFilesBytes),
                'node_modules_bytes' => $nodeModulesBytes,
                'node_modules_formatted' => self::formatBytes($nodeModulesBytes),
                'vendor_bytes' => $vendorBytes,
                'vendor_formatted' => self::formatBytes($vendorBytes),
                'other_files_bytes' => $otherProjectFilesBytes,
                'other_files_formatted' => self::formatBytes($otherProjectFilesBytes),
                'db_bytes' => $systemDbBytes,
                'db_formatted' => self::formatBytes($systemDbBytes),
                'db_records_count' => $systemDbRecordsCount,
                'percentage_of_platform' => $systemPercentage,
            ],
            // Total Platform Data
            'platform_total' => [
                'total_bytes' => $totalPlatformBytes,
                'total_formatted' => self::formatBytes($totalPlatformBytes),
            ],
        ];
    }

    /**
     * Calculate entire website application size on disk (node_modules + vendor + all files/folders).
     *
     * @return array{
     *     total_bytes: int,
     *     node_modules_bytes: int,
     *     vendor_bytes: int,
     *     other_bytes: int
     * }
     */
    public static function getEntireProjectSize(): array
    {
        $base = base_path();
        $totalBytes = 0;
        $nodeModulesBytes = 0;
        $vendorBytes = 0;
        $otherBytes = 0;

        $items = @scandir($base) ?: [];
        foreach ($items as $item) {
            if ($item === '.' || $item === '..') {
                continue;
            }

            $fullPath = $base . DIRECTORY_SEPARATOR . $item;
            if (is_file($fullPath)) {
                $fileSize = (int) @filesize($fullPath);
                $totalBytes += $fileSize;
                $otherBytes += $fileSize;
            } elseif (is_dir($fullPath)) {
                $dirSize = self::getDirectorySize($fullPath);
                $totalBytes += $dirSize;

                if ($item === 'node_modules') {
                    $nodeModulesBytes += $dirSize;
                } elseif ($item === 'vendor') {
                    $vendorBytes += $dirSize;
                } else {
                    $otherBytes += $dirSize;
                }
            }
        }

        return [
            'total_bytes' => $totalBytes,
            'node_modules_bytes' => $nodeModulesBytes,
            'vendor_bytes' => $vendorBytes,
            'other_bytes' => $otherBytes,
        ];
    }

    /**
     * Recursively calculate total size of a local directory.
     */
    protected static function getDirectorySize(string $directory): int
    {
        $size = 0;
        if (! is_dir($directory)) {
            return 0;
        }

        try {
            $files = new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator($directory, \FilesystemIterator::SKIP_DOTS)
            );

            foreach ($files as $file) {
                if ($file->isFile()) {
                    $size += $file->getSize();
                }
            }
        } catch (\Throwable $e) {
            // Ignore permission or inaccessible file errors safely
        }

        return $size;
    }
}
