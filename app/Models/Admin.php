<?php

namespace App\Models;

use App\Services\StorageCalculatorService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
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
        'store_id',
        'name',
        'email',
        'password',
        'max_outlets',
        'max_storage_mb',
        'is_lifetime_free',
        'monthly_fee',
        'otp',
        'otp_expires_at',
        'session_time',
        'two_factor_enabled',
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
            'max_outlets' => 'integer',
            'max_storage_mb' => 'integer',
            'is_lifetime_free' => 'boolean',
            'monthly_fee' => 'decimal:2',
            'two_factor_enabled' => 'boolean',
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
            if (empty($admin->store_id)) {
                $admin->store_id = 'STR-' . strtoupper(Str::random(6));
            }
            if (empty($admin->max_outlets)) {
                $admin->max_outlets = 5;
            }
            if (empty($admin->max_storage_mb)) {
                $admin->max_storage_mb = 500;
            }
        });
    }

    /**
     * Outlets belonging to this store/admin.
     */
    public function outlets(): HasMany
    {
        return $this->hasMany(Outlet::class, 'admin_id');
    }

    /**
     * Employees belonging to this store/admin.
     */
    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class, 'admin_id');
    }

    /**
     * Attendances belonging to this store/admin.
     */
    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class, 'admin_id');
    }

    /**
     * Website/store settings belonging to this store/admin.
     */
    public function setting(): HasOne
    {
        return $this->hasOne(WebsiteSetting::class, 'admin_id');
    }

    /**
     * Invoices belonging to this store.
     */
    public function invoices(): HasMany
    {
        return $this->hasMany(StoreInvoice::class, 'admin_id');
    }

    /**
     * Get or generate the invoice for a given billing month (defaults to current month).
     */
    public function getOrCreateCurrentInvoice(?string $month = null): ?StoreInvoice
    {
        if ($this->is_lifetime_free) {
            return null;
        }

        $billingMonth = $month ?: now()->format('Y-m');
        $invoice = $this->invoices()->where('billing_month', $billingMonth)->first();

        if (! $invoice) {
            $platformSetting = PlatformSetting::instance();
            $dueDay = min(max((int) ($platformSetting->payment_due_day ?: 7), 1), 28);
            $dueDate = now()->setDay($dueDay)->format('Y-m-d');
            $fee = $this->monthly_fee !== null ? (float) $this->monthly_fee : (float) ($platformSetting->default_monthly_fee ?: 500.00);

            $invoice = $this->invoices()->create([
                'invoice_number' => 'INV-' . str_replace('-', '', $billingMonth) . '-' . strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $this->store_id), 0, 8)) . '-' . rand(100, 999),
                'billing_month' => $billingMonth,
                'amount' => $fee,
                'due_date' => $dueDate,
                'status' => 'unpaid',
            ]);
        } else {
            // If the invoice is still unpaid or rejected and the admin's monthly fee differs from the invoice, update it
            if (in_array($invoice->status, ['unpaid', 'rejected']) && $this->monthly_fee !== null && (float) $invoice->amount !== (float) $this->monthly_fee) {
                $invoice->update(['amount' => (float) $this->monthly_fee]);
            }
        }

        return $invoice;
    }

    /**
     * Check if this store's service is suspended due to overdue unpaid invoice.
     * Rule: Free stores are NEVER suspended.
     * Paid stores: Must pay by the configured due day of the current month.
     * After the due day passes, if current month invoice is NOT paid, the service is suspended.
     */
    public function isSuspended(): bool
    {
        if ($this->is_lifetime_free) {
            return false;
        }

        $platformSetting = PlatformSetting::instance();
        $dueDay = min(max((int) ($platformSetting->payment_due_day ?: 7), 1), 31);
        $todayDay = (int) now()->format('j');

        // Within grace period (1st to due day of the month) -> not suspended yet
        if ($todayDay <= $dueDay) {
            return false;
        }

        // Passed deadline: check current month's invoice
        $invoice = $this->getOrCreateCurrentInvoice();
        if (! $invoice) {
            return false;
        }

        // Service runs ONLY if invoice is marked 'paid'
        return $invoice->status !== 'paid';
    }

    /**
     * Calculate total storage bytes consumed by this admin (images + attendance + database).
     */
    public function getTotalStorageBytes(): int
    {
        return StorageCalculatorService::getStoreStorageDetails($this)['total_bytes'];
    }

    /**
     * Formatted string of storage consumption.
     */
    public function getFormattedStorageAttribute(): string
    {
        return StorageCalculatorService::formatBytes($this->getTotalStorageBytes());
    }

    /**
     * Get detailed storage usage breakdown.
     */
    public function getStorageDetails(): array
    {
        return StorageCalculatorService::getStoreStorageDetails($this);
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
