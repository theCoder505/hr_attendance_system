<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (
            app()->environment('production') ||
            request()->isSecure() ||
            str_starts_with(config('app.url'), 'https://') ||
            str_contains(request()->header('x-forwarded-proto', ''), 'https')
        ) {
            URL::forceScheme('https');
        }

        // On production or live domains, disable Vite hot file so built assets are always loaded
        if (app()->environment('production') || (request()->getHost() && ! in_array(request()->getHost(), ['localhost', '127.0.0.1']))) {
            Vite::useHotFile(storage_path('vite.hot'));
            if (file_exists(public_path('hot'))) {
                @unlink(public_path('hot'));
            }
        }
    }
}
