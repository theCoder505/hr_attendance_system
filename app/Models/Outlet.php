<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Outlet extends Model
{
    use HasFactory;

    protected $table = 'outlets';

    protected $fillable = [
        'admin_id',
        'uid',
        'name',
        'wifi_ip',
        'max_employees',
    ];

    protected $casts = [
        'max_employees' => 'integer',
    ];

    /**
     * Effective max employees limit for this outlet.
     * Falls back to the admin's max_employees_per_outlet setting if not individually overridden.
     */
    public function getMaxEmployeesLimitAttribute(): int
    {
        if ($this->max_employees !== null && (int) $this->max_employees > 0) {
            return (int) $this->max_employees;
        }

        return (int) ($this->admin?->max_employees_per_outlet ?: 25);
    }

    protected static function booted(): void
    {
        parent::booted();

        static::creating(function ($outlet) {
            if (empty($outlet->uid)) {
                $outlet->uid = 'OUT-' . strtoupper(Str::random(6));
            }
        });

        static::deleting(function ($outlet) {
            // Cascade delete all employees (which triggers file deletions and attendance deletions)
            foreach ($outlet->employees as $employee) {
                $employee->delete();
            }

            // Ensure any direct attendances associated with this outlet are also removed
            $outlet->attendances()->delete();
        });
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'admin_id');
    }

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class, 'outlet_id');
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class, 'outlet_id');
    }
}
