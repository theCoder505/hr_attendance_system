<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StoreInvoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'admin_id',
        'invoice_number',
        'billing_month',
        'amount',
        'paid_amount',
        'due_date',
        'status',
        'payment_method',
        'transaction_id',
        'payment_time',
        'payment_note',
        'rejection_reason',
        'submitted_at',
        'verified_at',
        'verified_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'due_date' => 'date',
        'submitted_at' => 'datetime',
        'verified_at' => 'datetime',
    ];

    /**
     * Store (Admin) owning this invoice.
     */
    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'admin_id');
    }

    /**
     * Super Admin who verified or rejected this invoice.
     */
    public function verifier(): BelongsTo
    {
        return $this->belongsTo(SuperAdmin::class, 'verified_by');
    }
}

