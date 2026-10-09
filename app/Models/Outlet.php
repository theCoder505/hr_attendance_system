<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Outlet extends Model
{
    use HasFactory;

    protected $table = 'outlets';

    protected $fillable = [
        'uid',
        'name',
        'wifi_ip',
    ];

    protected static function booted(): void
    {
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

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class, 'outlet_id');
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class, 'outlet_id');
    }
}
