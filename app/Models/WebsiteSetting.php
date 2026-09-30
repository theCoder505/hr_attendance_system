<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WebsiteSetting extends Model
{
    use HasFactory;

    protected $table = 'website_settings';

    protected $fillable = [
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

    /**
     * Get or create the singleton website settings row.
     */
    public static function current(): self
    {
        $setting = static::first();

        if (! $setting) {
            $setting = static::create([
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
}
