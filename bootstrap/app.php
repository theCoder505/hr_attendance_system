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
        $middleware->validateCsrfTokens(except: [
            'attendance',
            'attendance/*',
        ]);

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
            if ($request->is('super-admin') || $request->is('super-admin/*')) {
                return route('super-admin.login');
            }
            return route('admin.login');
        });

        $middleware->redirectUsersTo(function (\Illuminate\Http\Request $request) {
            if ($request->is('super-admin') || $request->is('super-admin/*')) {
                return route('super-admin.dashboard');
            }
            return route('admin.dashboard');
        });
    })
    ->withSchedule(function (\Illuminate\Console\Scheduling\Schedule $schedule) {
        $schedule->command('attendance:close-missing-checkouts')->hourly();
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->respond(function (\Symfony\Component\HttpFoundation\Response $response, \Throwable $exception, \Illuminate\Http\Request $request) {
            if (! app()->environment(['local', 'testing']) && in_array($response->getStatusCode(), [500, 503, 505, 404, 403])) {
                if ($request->header('X-Inertia')) {
                    return inertia('error', [
                        'status' => $response->getStatusCode(),
                    ])->toResponse($request)->setStatusCode($response->getStatusCode());
                }
            } elseif ($response->getStatusCode() === 419) {
                return back()->with([
                    'error' => 'The page session expired, please try again.',
                ]);
            }

            return $response;
        });
    })->create();
