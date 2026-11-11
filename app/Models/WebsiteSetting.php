<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WebsiteSetting extends Model
{
    use HasFactory;

    protected $table = 'website_settings';

    protected $fillable = [
        'admin_id',
        'brandname',
        'logo',
        'favicon',
        'office_starting_time',
        'office_closing_time',
        'office_ipv4_addr',
        'missing_checkout_early_leave_minutes',
        'admin_login_2fa_enabled',
    ];

    protected function casts(): array
    {
        return [
            'missing_checkout_early_leave_minutes' => 'integer',
            'admin_login_2fa_enabled' => 'boolean',
        ];
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'admin_id');
    }

    /**
     * Get or create setting for a specific admin or fallback to global.
     */
    public static function forAdmin(?int $adminId): self
    {
        if ($adminId) {
            $setting = static::where('admin_id', $adminId)->first();
            if ($setting) {
                return $setting;
            }

            // Create new settings record copied from global defaults
            $global = static::first();
            return static::create([
                'admin_id' => $adminId,
                'brandname' => $global->brandname ?? 'AttendEase Store',
                'logo' => null,
                'favicon' => null,
                'office_starting_time' => $global->office_starting_time ?? '09:00:00',
                'office_closing_time' => $global->office_closing_time ?? '17:00:00',
                'office_ipv4_addr' => $global->office_ipv4_addr ?? '127.0.0.1',
                'missing_checkout_early_leave_minutes' => $global->missing_checkout_early_leave_minutes ?? 60,
                'admin_login_2fa_enabled' => true,
            ]);
        }

        return static::current();
    }

    /**
     * Get or create the singleton website settings row.
     */
    public static function current(): self
    {
        $setting = static::first();

        if (! $setting) {
            $setting = static::create([
                'admin_id' => null,
                'brandname' => 'AttendEase Pro',
                'logo' => null,
                'favicon' => null,
                'office_starting_time' => '09:00:00',
                'office_closing_time' => '17:00:00',
                'office_ipv4_addr' => '127.0.0.1',
                'missing_checkout_early_leave_minutes' => 60,
                'admin_login_2fa_enabled' => true,
            ]);
        }

        return $setting;
    }

    protected static function booted(): void
    {
        parent::booted();

        static::saved(function () {
            static::generateManifest();
        });
    }

    /**
     * Generate or update the Web App Manifest (manifest.json) using dynamic settings.
     */
    public static function generateManifest(): void
    {
        try {
            $settings = static::current();
            $brandname = !empty($settings->brandname) ? $settings->brandname : config('app.name', 'AttendEase Pro');

            $faviconUrl = !empty($settings->favicon)
                ? asset('storage/' . $settings->favicon)
                : asset('favicon.ico');

            $faviconExt = !empty($settings->favicon)
                ? strtolower(pathinfo($settings->favicon, PATHINFO_EXTENSION))
                : 'ico';

            $faviconMime = match ($faviconExt) {
                'png' => 'image/png',
                'svg' => 'image/svg+xml',
                'jpg', 'jpeg' => 'image/jpeg',
                'webp' => 'image/webp',
                'gif' => 'image/gif',
                default => 'image/x-icon',
            };

            $manifest = [
                'name' => $brandname,
                'short_name' => $brandname,
                'description' => "Real-time Attendance and Employee Management Portal",
                'start_url' => '/',
                'scope' => '/',
                'display' => 'standalone',
                'orientation' => 'portrait',
                'background_color' => '#ffffff',
                'theme_color' => '#4f46e5',
                'icons' => [
                    [
                        'src' => $faviconUrl,
                        'sizes' => '192x192',
                        'type' => $faviconMime,
                        'purpose' => 'any maskable',
                    ],
                    [
                        'src' => $faviconUrl,
                        'sizes' => '512x512',
                        'type' => $faviconMime,
                        'purpose' => 'any maskable',
                    ],
                    [
                        'src' => $faviconUrl,
                        'sizes' => 'any',
                        'type' => $faviconMime,
                        'purpose' => 'any maskable',
                    ],
                ],
            ];

            @file_put_contents(public_path('manifest.json'), json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        } catch (\Throwable $e) {
            // Silently ignore during build/testing
        }
    }
}
