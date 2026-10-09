<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Outlet;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OutletController extends Controller
{
    /**
     * Store a newly created outlet (Maximum 5 outlets).
     */
    public function store(Request $request): RedirectResponse
    {
        if (Outlet::count() >= 5) {
            return back()->with('error', 'Maximum limit of 5 outlets reached. Delete an existing outlet before adding a new one.');
        }

        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'wifi_ip' => ['required', 'string', 'max:255'],
        ]);

        $cleanWifi = trim($request->wifi_ip);
        if ($cleanWifi === '::1') {
            $cleanWifi = '127.0.0.1';
        }

        $outlet = Outlet::create([
            'name' => trim($request->name),
            'wifi_ip' => $cleanWifi,
        ]);

        return back()->with('success', "Outlet '{$outlet->name}' created successfully.");
    }

    /**
     * Update the specified outlet.
     */
    public function update(Request $request, Outlet $outlet): RedirectResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'wifi_ip' => ['required', 'string', 'max:255'],
        ]);

        $cleanWifi = trim($request->wifi_ip);
        if ($cleanWifi === '::1') {
            $cleanWifi = '127.0.0.1';
        }

        $outlet->update([
            'name' => trim($request->name),
            'wifi_ip' => $cleanWifi,
        ]);

        return back()->with('success', "Outlet '{$outlet->name}' updated successfully.");
    }

    /**
     * Remove the specified outlet and all associated employee and attendance records.
     */
    public function destroy(Outlet $outlet): RedirectResponse
    {
        $name = $outlet->name;
        $employeeCount = $outlet->employees()->count();
        $attendanceCount = $outlet->attendances()->count();

        DB::transaction(function () use ($outlet) {
            // Delete all employees assigned to this outlet (this also deletes their files and attendances)
            foreach ($outlet->employees as $employee) {
                $employee->delete();
            }

            // Remove any remaining direct attendances for this outlet
            $outlet->attendances()->delete();

            // Delete the outlet
            $outlet->delete();
        });

        return back()->with('success', "Outlet '{$name}' and all associated records ({$employeeCount} employees, {$attendanceCount} attendance logs) were permanently removed.");
    }
}
