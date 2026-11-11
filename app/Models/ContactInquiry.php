<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContactInquiry extends Model
{
    use HasFactory;

    protected $table = 'contact_inquiries';

    protected $fillable = [
        'company_name',
        'subject',
        'email',
        'phone',
        'total_outlets',
        'avg_employees_per_outlet',
        'message',
        'status',
        'reply_message',
        'replied_at',
        'replied_by',
    ];

    protected function casts(): array
    {
        return [
            'total_outlets' => 'integer',
            'avg_employees_per_outlet' => 'integer',
            'replied_at' => 'datetime',
        ];
    }

    /**
     * The Super Admin who replied to this inquiry.
     */
    public function replier(): BelongsTo
    {
        return $this->belongsTo(SuperAdmin::class, 'replied_by');
    }
}

