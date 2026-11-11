<?php

namespace Tests\Feature;

use App\Http\Controllers\SuperAdmin\ProfileController;
use App\Models\PlatformSetting;
use App\Models\SuperAdmin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SuperAdminContactChannelsTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_can_update_contact_and_social_channels()
    {
        $superAdmin = SuperAdmin::create([
            'name' => 'Root Super Admin',
            'email' => 'super@platform.com',
            'password' => Hash::make('Secret@123'),
        ]);

        $req = Request::create('/super-admin/settings/contact-channels', 'POST', [
            'whatsapp_number' => '+8801712345678',
            'contact_number' => '+8801812345678',
            'facebook_url' => 'https://facebook.com/attendeasepro',
            'youtube_url' => 'https://youtube.com/@attendeasepro',
        ]);

        $controller = new ProfileController();
        $controller->updateContactChannels($req);

        $this->assertDatabaseHas('platform_settings', [
            'whatsapp_number' => '+8801712345678',
            'contact_number' => '+8801812345678',
            'facebook_url' => 'https://facebook.com/attendeasepro',
            'youtube_url' => 'https://youtube.com/@attendeasepro',
        ]);
    }

    public function test_contact_page_receives_contact_settings()
    {
        $platform = PlatformSetting::instance();
        $platform->update([
            'whatsapp_number' => '+8801799999999',
            'contact_number' => '+8801888888888',
            'facebook_url' => 'https://facebook.com/testpage',
            'youtube_url' => 'https://youtube.com/@testchannel',
        ]);

        $response = $this->get('/contact');
        $response->assertOk();
    }

    public function test_portfolio_docx_download_route()
    {
        $response = $this->get('/download-portfolio-docx');
        $response->assertOk();
        $this->assertTrue(str_contains($response->headers->get('content-disposition') ?? '', 'AttendEase_Pro_Sales_Portfolio.docx'));
    }
}
