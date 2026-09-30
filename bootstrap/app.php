<?php

use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'admin.timeout' => \App\Http\Middleware\AdminSessionTimeout::class,
            'verify.device' => \App\Http\Middleware\VerifyDeviceToken::class,
            'office.network' => \App\Http\Middleware\OfficeNetworkMiddleware::class,
        ]);

        $middleware->redirectGuestsTo(function (\Illuminate\Http\Request $request) {
            return route('admin.login');
        });

        $middleware->redirectUsersTo(function (\Illuminate\Http\Request $request) {
            return route('admin.dashboard');
        });
    })
    ->withSchedule(function (\Illuminate\Console\Scheduling\Schedule $schedule) {
        $schedule->command('attendance:close-missing-checkouts')->hourly();
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
