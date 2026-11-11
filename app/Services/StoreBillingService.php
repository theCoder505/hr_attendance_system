<?php

namespace App\Services;

use App\Models\Admin;
use App\Models\PlatformSetting;
use App\Models\StoreInvoice;
use App\Models\SuperAdmin;

class StoreBillingService
{
    /**
     * Submit payment details for an invoice by the store owner.
     */
    public function submitPayment(StoreInvoice $invoice, array $data): StoreInvoice
    {
        $invoice->update([
            'paid_amount' => $data['paid_amount'],
            'payment_method' => $data['payment_method'],
            'transaction_id' => trim($data['transaction_id']),
            'payment_time' => trim($data['payment_time'] ?? now()->toDateTimeString()),
            'payment_note' => isset($data['payment_note']) ? trim($data['payment_note']) : null,
            'status' => 'pending_verification',
            'submitted_at' => now(),
            'rejection_reason' => null, // clear previous rejection on resubmission
        ]);

        return $invoice;
    }

    /**
     * Accept & verify payment by Super Admin.
     */
    public function verifyPayment(StoreInvoice $invoice, SuperAdmin $superAdmin): StoreInvoice
    {
        $invoice->update([
            'status' => 'paid',
            'verified_at' => now(),
            'verified_by' => $superAdmin->id,
            'rejection_reason' => null,
        ]);

        return $invoice;
    }

    /**
     * Reject payment by Super Admin with a specified reason.
     */
    public function rejectPayment(StoreInvoice $invoice, string $reason, SuperAdmin $superAdmin): StoreInvoice
    {
        $invoice->update([
            'status' => 'rejected',
            'rejection_reason' => trim($reason),
            'verified_by' => $superAdmin->id,
        ]);

        return $invoice;
    }

    /**
     * Ensure all paid stores have an invoice for the current month.
     */
    public function syncMonthlyInvoices(): void
    {
        $stores = Admin::where('is_lifetime_free', false)->get();
        foreach ($stores as $store) {
            $store->getOrCreateCurrentInvoice();
        }
    }
}

