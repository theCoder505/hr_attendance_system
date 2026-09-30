<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;

class Admin extends Authenticatable
{
    use HasFactory, Notifiable;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'admins';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'uid',
        'name',
        'email',
        'password',
        'otp',
        'otp_expires_at',
        'session_time',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'otp',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'otp_expires_at' => 'datetime',
            'session_time' => 'integer',
        ];
    }

    /**
     * Boot function from Laravel.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($admin) {
            if (empty($admin->uid)) {
                $admin->uid = 'ADM-' . strtoupper(Str::random(8));
            }
        });
    }

    /**
     * Generate an email OTP for admin authentication/changes.
     */
    public function generateOtp(int $minutes = 10): string
    {
        $otp = (string) random_int(100000, 999999);
        $this->update([
            'otp' => $otp,
            'otp_expires_at' => now()->addMinutes($minutes),
        ]);

        return $otp;
    }

    /**
     * Verify the supplied OTP.
     */
    public function verifyOtp(string $otp): bool
    {
        if (empty($this->otp) || empty($this->otp_expires_at)) {
            return false;
        }

        if (now()->isAfter($this->otp_expires_at)) {
            return false;
        }

        if (hash_equals((string) $this->otp, (string) $otp)) {
            $this->update([
                'otp' => null,
                'otp_expires_at' => null,
            ]);
            return true;
        }

        return false;
    }
}
