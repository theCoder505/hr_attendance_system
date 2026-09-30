<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class Employee extends Model
{
    use HasFactory;

    protected $table = 'employees';

    protected $fillable = [
        'uid',
        'name',
        'phone',
        'role',
        'work_desc',
        'salary',
        'working_hours',
        'check_in_time',
        'check_out_time',
        'joining_date',
        'image',
        'appointment_letter',
        'status',
        'device_token_hash',
        'device_token_expires_at',
        'verification_token',
        'verification_expires_at',
    ];

    protected function casts(): array
    {
        return [
            'salary' => 'decimal:2',
            'working_hours' => 'decimal:2',
            'status' => 'integer',
            'joining_date' => 'date',
            'device_token_expires_at' => 'datetime',
            'verification_expires_at' => 'datetime',
        ];
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($employee) {
            if (empty($employee->uid)) {
                $employee->uid = 'EMP-' . strtoupper(Str::random(7));
            }

            // Defaults for check_in_time and check_out_time from website settings
            $settings = WebsiteSetting::current();
            if (empty($employee->check_in_time)) {
                $employee->check_in_time = $settings->office_starting_time ?? '09:00:00';
            }
            if (empty($employee->check_out_time)) {
                $employee->check_out_time = $settings->office_closing_time ?? '17:00:00';
            }

            // New employees start with status 0 and a verification token valid for 7 days
            if (empty($employee->verification_token)) {
                $employee->verification_token = Str::random(40);
                $employee->verification_expires_at = now()->addDays(7);
                $employee->status = 0;
            }
        });

        // Cascade delete files and attendances on deletion
        static::deleting(function ($employee) {
            if (! empty($employee->image) && Storage::disk('public')->exists($employee->image)) {
                Storage::disk('public')->delete($employee->image);
            }
            if (! empty($employee->appointment_letter) && Storage::disk('public')->exists($employee->appointment_letter)) {
                Storage::disk('public')->delete($employee->appointment_letter);
            }

            $employee->attendances()->delete();
        });
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class, 'employee_id');
    }

    /**
     * Check if employee is verified.
     */
    public function isVerified(): bool
    {
        return $this->status === 1 &&
               ! empty($this->device_token_hash) &&
               $this->device_token_expires_at !== null &&
               now()->isBefore($this->device_token_expires_at);
    }

    /**
     * Generate new verification token (e.g. for re-verification / device change).
     */
    public function resetForReverification(): string
    {
        $token = Str::random(40);
        $this->update([
            'status' => 0,
            'device_token_hash' => null,
            'device_token_expires_at' => null,
            'verification_token' => $token,
            'verification_expires_at' => now()->addDays(7),
        ]);

        return $token;
    }
}
