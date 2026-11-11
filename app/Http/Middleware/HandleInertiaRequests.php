<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $admin = \Illuminate\Support\Facades\Auth::guard('admin')->user();
        $superAdmin = \Illuminate\Support\Facades\Auth::guard('super_admin')->user();
        $globalSetting = \App\Models\WebsiteSetting::current();

        if ($request->is('super-admin*')) {
            $settings = $globalSetting;
        } elseif ($admin) {
            $settings = \App\Models\WebsiteSetting::forAdmin($admin->id);
        } else {
            $settings = $globalSetting;
        }

        $brandname = ! empty($globalSetting->brandname) ? $globalSetting->brandname : ($settings->brandname ?? config('app.name', 'Attendance'));

        return array_merge(parent::share($request), [
            'name' => $brandname,
            'settings' => $settings,
            'timezone' => config('app.timezone', 'Asia/Dhaka'),
            'auth' => [
                'admin' => $admin ? [
                    'id' => $admin->id,
                    'uid' => $admin->uid,
                    'store_id' => $admin->store_id,
                    'name' => $admin->name,
                    'email' => $admin->email,
                    'max_outlets' => $admin->max_outlets,
                    'max_employees_per_outlet' => (int) ($admin->max_employees_per_outlet ?: 25),
                    'is_lifetime_free' => (bool) $admin->is_lifetime_free,
                    'is_suspended' => $admin->isSuspended(),
                    'session_time' => $admin->session_time,
                ] : null,
                'super_admin' => $superAdmin ? [
                    'id' => $superAdmin->id,
                    'name' => $superAdmin->name,
                    'email' => $superAdmin->email,
                    'session_time' => $superAdmin->session_time,
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'warning' => fn () => $request->session()->get('warning'),
                'info' => fn () => $request->session()->get('info'),
                'new_verification_link' => fn () => $request->session()->get('new_verification_link'),
            ],
        ]);
    }
}
