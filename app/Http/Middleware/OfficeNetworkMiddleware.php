<?php

namespace App\Http\Middleware;

use App\Models\Outlet;
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
        /** @var \App\Models\Employee|null $employee */
        $employee = $request->attributes->get('employee');

        $targetOutletName = null;
        $allowedIps = [];

        if ($employee && $employee->outlet) {
            $targetOutletName = $employee->outlet->name;
            $rawIps = $employee->outlet->wifi_ip;
            $allowedIps = array_map(function ($ip) {
                $trimmed = trim($ip);
                return ($trimmed === '::1') ? '127.0.0.1' : $trimmed;
            }, explode(',', $rawIps));
        } else {
            // Fallback to website settings or all outlet IPs
            $settings = WebsiteSetting::current();
            $officeIp = trim((string) ($settings->office_ipv4_addr ?? ''));
            if (! empty($officeIp)) {
                foreach (explode(',', $officeIp) as $ip) {
                    $trimmed = trim($ip);
                    $allowedIps[] = ($trimmed === '::1') ? '127.0.0.1' : $trimmed;
                }
            }
            $allOutletIps = Outlet::pluck('wifi_ip')->toArray();
            foreach ($allOutletIps as $ips) {
                foreach (explode(',', $ips) as $ip) {
                    $trimmed = trim($ip);
                    $allowedIps[] = ($trimmed === '::1') ? '127.0.0.1' : $trimmed;
                }
            }
            $allowedIps = array_values(array_unique(array_filter($allowedIps)));
        }

        // If wildcard * is present or no restrictions specified
        if (empty($allowedIps) || in_array('*', $allowedIps, true)) {
            return $next($request);
        }

        $clientIp = $request->ip();
        $normalizedClientIp = ($clientIp === '::1') ? '127.0.0.1' : $clientIp;

        if (! in_array($normalizedClientIp, $allowedIps, true)) {
            $requiredLabel = $targetOutletName 
                ? "outlet '{$targetOutletName}'"
                : "designated office WiFi";

            if ($request->expectsJson() || $request->isXmlHttpRequest() || $request->header('X-Inertia')) {
                return response()->json([
                    'success' => false,
                    'code' => 'OFFICE_NETWORK_REQUIRED',
                    'message' => "Please connect to the designated WiFi for {$requiredLabel}.",
                    'current_ip' => $clientIp,
                    'office_ip' => implode(', ', $allowedIps),
                    'outlet_name' => $targetOutletName,
                ], 403);
            }

            return response()->view('errors.office-network', [
                'current_ip' => $clientIp,
                'office_ip' => implode(', ', $allowedIps),
                'outlet_name' => $targetOutletName,
            ], 403);
        }

        return $next($request);
    }
}
