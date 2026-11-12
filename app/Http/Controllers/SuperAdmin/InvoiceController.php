<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
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
     * Display a listing of all store invoices.
     */
    public function index(Request $request, StoreBillingService $billingService): Response
    {
        // Ensure all paid stores have an invoice for the current month
        $billingService->syncMonthlyInvoices();

        $status = $request->query('status', 'all');
        $search = $request->query('search');

        $query = StoreInvoice::with(['admin:id,name,store_id,email,phone', 'verifier:id,name'])
            ->orderByRaw("CASE WHEN status = 'pending_verification' THEN 1 WHEN status = 'unpaid' THEN 2 WHEN status = 'rejected' THEN 3 ELSE 4 END")
            ->orderBy('due_date', 'desc')
            ->orderBy('id', 'desc');

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        if (! empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                    ->orWhere('transaction_id', 'like', "%{$search}%")
                    ->orWhereHas('admin', function ($storeQ) use ($search) {
                        $storeQ->where('name', 'like', "%{$search}%")
                            ->orWhere('store_id', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    });
            });
        }

        $invoices = $query->paginate(15)->withQueryString();

        $invoices->through(function ($invoice) {
            if ($invoice->admin) {
                $invoice->admin->makeVisible(['phone']);
            }

            return $invoice;
        });

        $counts = [
            'all' => StoreInvoice::count(),
            'pending_verification' => StoreInvoice::where('status', 'pending_verification')->count(),
            'paid' => StoreInvoice::where('status', 'paid')->count(),
            'unpaid' => StoreInvoice::where('status', 'unpaid')->count(),
            'rejected' => StoreInvoice::where('status', 'rejected')->count(),
        ];

        return Inertia::render('super-admin/invoices/index', [
            'invoices' => $invoices,
            'filters' => [
                'status' => $status,
                'search' => $search ?? '',
            ],
            'counts' => $counts,
        ]);
    }

    /**
     * Verify / accept a payment transaction.
     */
    public function verify(StoreInvoice $invoice, StoreBillingService $billingService): RedirectResponse
    {
        $superAdmin = Auth::guard('super_admin')->user();
        $billingService->verifyPayment($invoice, $superAdmin);

        return back()->with('success', "Invoice {$invoice->invoice_number} verified and marked as PAID. Service is active for {$invoice->admin->name}.");
    }

    /**
     * Reject a payment transaction with a reason.
     */
    public function reject(Request $request, StoreInvoice $invoice, StoreBillingService $billingService): RedirectResponse
    {
        $request->validate([
            'rejection_reason' => ['required', 'string', 'max:500'],
        ]);

        $superAdmin = Auth::guard('super_admin')->user();
        $billingService->rejectPayment($invoice, $request->rejection_reason, $superAdmin);

        return back()->with('success', "Payment for invoice {$invoice->invoice_number} was rejected. Store owner can review the reason and resubmit.");
    }
}

