<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\PlatformSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserManualController extends Controller
{
    /**
     * Show User Manual CMS editor.
     */
    public function index(): Response
    {
        $platform = PlatformSetting::instance();

        return Inertia::render('super-admin/user-manual/index', [
            'pdfUrl' => $platform->user_manual_pdf_path ?: '/docs/user-manual.pdf',
        ]);
    }

    /**
     * Upload / replace User Manual PDF.
     */
    public function update(Request $request): RedirectResponse
    {
        $request->validate([
            'pdf_file' => ['required', 'file', 'mimes:pdf', 'max:20480'], // max 20MB
        ]);

        $file = $request->file('pdf_file');
        $fileName = 'user-manual-' . time() . '.pdf';
        $file->move(public_path('docs'), $fileName);

        $platform = PlatformSetting::instance();
        $platform->update([
            'user_manual_pdf_path' => '/docs/' . $fileName,
        ]);

        return back()->with('success', 'User Manual PDF uploaded and published successfully across platform.');
    }
}

