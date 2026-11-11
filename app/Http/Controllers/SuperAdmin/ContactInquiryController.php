<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Mail\ContactReplyMail;
use App\Models\ContactInquiry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class ContactInquiryController extends Controller
{
    /**
     * Display a listing of contact inquiries.
     */
    public function index(Request $request): Response
    {
        $status = $request->query('status', 'all');
        $search = $request->query('search');

        $query = ContactInquiry::with('replier')->orderBy('created_at', 'desc');

        if ($status !== 'all' && in_array($status, ['pending', 'replied'])) {
            $query->where('status', $status);
        }

        if (! empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('company_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('subject', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $inquiries = $query->paginate(12)->withQueryString();

        $counts = [
            'all' => ContactInquiry::count(),
            'pending' => ContactInquiry::where('status', 'pending')->count(),
            'replied' => ContactInquiry::where('status', 'replied')->count(),
        ];

        return Inertia::render('super-admin/inquiries/index', [
            'inquiries' => $inquiries,
            'counts' => $counts,
            'filters' => [
                'status' => $status,
                'search' => $search ?? '',
            ],
        ]);
    }

    /**
     * Reply to a contact inquiry and send email response.
     */
    public function reply(Request $request, ContactInquiry $inquiry): RedirectResponse
    {
        $request->validate([
            'reply_message' => ['required', 'string', 'min:5', 'max:5000'],
        ]);

        $replyMessage = trim($request->reply_message);

        $inquiry->update([
            'reply_message' => $replyMessage,
            'replied_at' => now(),
            'replied_by' => Auth::guard('super_admin')->id(),
            'status' => 'replied',
        ]);

        try {
            Mail::to($inquiry->email)->send(new ContactReplyMail($inquiry, $replyMessage));
        } catch (\Throwable $e) {
            Log::error('Failed to send contact inquiry reply mail: ' . $e->getMessage());
        }

        return back()->with('success', "Reply sent successfully to {$inquiry->email} and recorded in database.");
    }

    /**
     * Remove the specified contact inquiry.
     */
    public function destroy(ContactInquiry $inquiry): RedirectResponse
    {
        $inquiry->delete();

        return back()->with('success', 'Contact inquiry was removed.');
    }
}

