<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    use HasFactory;

    protected $table = 'attendances';

    protected $fillable = [
        'admin_id',
        'outlet_id',
        'employee_id',
        'date',
        'check_in_at',
        'check_out_at',
        'late_minutes',
        'overtime_minutes',
        'early_leave_minutes',
        'is_manual',
    ];

    protected function casts(): array
    {
        return [
            // 'date' => 'date',
            'check_in_at' => 'datetime',
            'check_out_at' => 'datetime',
            'late_minutes' => 'integer',
            'overtime_minutes' => 'integer',
            'early_leave_minutes' => 'integer',
            'is_manual' => 'boolean',
        ];
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($attendance) {
            if (empty($attendance->admin_id) && ! empty($attendance->employee_id)) {
                $employee = Employee::find($attendance->employee_id);
                if ($employee && $employee->admin_id) {
                    $attendance->admin_id = $employee->admin_id;
                }
            }
        });
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'admin_id');
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class, 'outlet_id');
    }
}
