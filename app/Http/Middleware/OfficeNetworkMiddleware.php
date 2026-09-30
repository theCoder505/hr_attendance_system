<?php

namespace App\Http\Middleware;

use App\Models\WebsiteSetting;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class OfficeNetworkMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $settings = WebsiteSetting::current();
        $officeIp = trim((string) ($settings->office_ipv4_addr ?? ''));

        // If office IP is configured and not empty
        if (! empty($officeIp) && $officeIp !== '*') {
            $clientIp = $request->ip();

            // Normalize localhost IPv6 to IPv4 if necessary
            $normalizedClientIp = ($clientIp === '::1') ? '127.0.0.1' : $clientIp;
            $normalizedOfficeIp = ($officeIp === '::1') ? '127.0.0.1' : $officeIp;

            // Check if matches or if multiple comma-separated IPs are allowed
            $allowedIps = array_map('trim', explode(',', $normalizedOfficeIp));

            if (! in_array($normalizedClientIp, $allowedIps, true)) {
                if ($request->expectsJson() || $request->isXmlHttpRequest() || $request->header('X-Inertia')) {
                    return response()->json([
                        'success' => false,
                        'code' => 'OFFICE_NETWORK_REQUIRED',
                        'message' => 'Please come to the office and use your registered device.',
                        'current_ip' => $clientIp,
                        'office_ip' => $officeIp,
                    ], 403);
                }

                return response()->view('errors.office-network', [
                    'current_ip' => $clientIp,
                    'office_ip' => $officeIp,
                ], 403);
            }
        }

        return $next($request);
    }
}
