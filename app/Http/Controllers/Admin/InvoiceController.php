<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PlatformSetting;
use App\Models\StoreInvoice;
use App\Services\StoreBillingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceController extends Controller
{
    /**
     * Display a listing of invoices for the authenticated store.
     */
    public function index(): Response|RedirectResponse
    {
        $admin = Auth::guard('admin')->user();

        // If Lifetime Free, hide invoice/billing view completely
        if ($admin->is_lifetime_free) {
            return redirect()->route('admin.dashboard')->with('info', 'Your store enjoys Lifetime Free access. Invoices and subscription payments are not required.');
        }

        // Ensure current month's invoice is present
        $admin->getOrCreateCurrentInvoice();

        $invoices = $admin->invoices()->orderBy('due_date', 'desc')->orderBy('id', 'desc')->get();
        $platform = PlatformSetting::instance();

        return Inertia::render('admin/invoices/index', [
            'invoices' => $invoices,
            'isSuspended' => $admin->isSuspended(),
            'platformSettings' => [
                'bkash_number' => $platform->bkash_number,
                'bkash_type' => $platform->bkash_type,
                'bkash_enabled' => (bool) $platform->bkash_enabled,
                'nagad_number' => $platform->nagad_number,
                'nagad_type' => $platform->nagad_type,
                'nagad_enabled' => (bool) $platform->nagad_enabled,
                'bank_name' => $platform->bank_name,
                'bank_account_name' => $platform->bank_account_name,
                'bank_account_number' => $platform->bank_account_number,
                'bank_branch' => $platform->bank_branch,
                'bank_routing' => $platform->bank_routing,
                'bank_enabled' => (bool) $platform->bank_enabled,
                'payment_due_day' => (int) ($platform->payment_due_day ?: 7),
            ],
        ]);
    }

    /**
     * Submit transaction payment details for an unpaid or rejected invoice.
     */
    public function submitPayment(Request $request, StoreInvoice $invoice, StoreBillingService $billingService): RedirectResponse
    {
        $admin = Auth::guard('admin')->user();

        if ($invoice->admin_id !== $admin->id) {
            abort(403, 'Unauthorized invoice access.');
        }

        if ($invoice->status === 'paid') {
            return back()->with('info', 'This invoice is already marked as PAID.');
        }

        $data = $request->validate([
            'paid_amount' => ['required', 'numeric', 'min:1'],
            'payment_method' => ['required', 'string', 'in:bkash,nagad,bank'],
            'transaction_id' => ['required', 'string', 'max:128'],
            'payment_time' => ['required', 'string', 'max:128'],
            'payment_note' => ['nullable', 'string', 'max:500'],
        ]);

        $billingService->submitPayment($invoice, $data);

        return back()->with('success', "Payment details for Invoice {$invoice->invoice_number} submitted. Verification is pending approval by Super Admin.");
    }
}

