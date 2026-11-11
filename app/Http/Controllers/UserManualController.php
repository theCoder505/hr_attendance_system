<?php

namespace App\Http\Controllers;

use App\Models\PlatformSetting;
use App\Models\WebsiteSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserManualController extends Controller
{
    /**
     * Public User Manual page (accessible via website footer).
     */
    public function publicIndex(): Response
    {
        $platform = PlatformSetting::instance();
        $website = WebsiteSetting::current();

        $pdfUrl = $platform->user_manual_pdf_path ?: '/docs/user-manual.pdf';

        return Inertia::render('user-manual/index', [
            'brandname' => $website->brandname ?? 'AttendEase',
            'logo' => $website->logo,
            'pdfUrl' => $pdfUrl,
        ]);
    }

    /**
     * Store Owner Portal User Manual page.
     */
    public function storeIndex(): Response
    {
        $platform = PlatformSetting::instance();
        $pdfUrl = $platform->user_manual_pdf_path ?: '/docs/user-manual.pdf';

        return Inertia::render('admin/user-manual/index', [
            'pdfUrl' => $pdfUrl,
        ]);
    }
}

