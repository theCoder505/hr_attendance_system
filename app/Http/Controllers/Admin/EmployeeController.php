<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreEmployeeRequest;
use App\Http\Requests\Admin\UpdateEmployeeRequest;
use App\Models\Employee;
use App\Models\WebsiteSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeController extends Controller
{
    /**
     * Display a listing of employees.
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $status = $request->query('status');

        $query = Employee::withCount('attendances')->orderBy('created_at', 'desc');

        if (! empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('uid', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('role', 'like', "%{$search}%");
            });
        }

        if ($status !== null && $status !== '') {
            $query->where('status', (int) $status);
        }

        $employees = $query->paginate(15)->withQueryString();
        $settings = WebsiteSetting::current();

        return Inertia::render('admin/employees/index', [
            'employees' => $employees,
            'filters' => [
                'search' => $search ?? '',
                'status' => $status ?? '',
            ],
            'defaultTimes' => [
                'check_in_time' => $settings->office_starting_time ?? '09:00:00',
                'check_out_time' => $settings->office_closing_time ?? '17:00:00',
            ],
            'appUrl' => url('/'),
        ]);
    }

    /**
     * Store a newly created employee.
     */
    public function store(StoreEmployeeRequest $request): RedirectResponse
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('employees/images', 'public');
        }

        if ($request->hasFile('appointment_letter')) {
            $data['appointment_letter'] = $request->file('appointment_letter')->store('employees/letters', 'public');
        }

        $employee = Employee::create($data);

        return redirect()->route('admin.employees.index')->with('success', "Employee '{$employee->name}' registered successfully. Verification link generated.");
    }

    /**
     * Update the specified employee.
     */
    public function update(UpdateEmployeeRequest $request, Employee $employee): RedirectResponse
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            if (! empty($employee->image) && Storage::disk('public')->exists($employee->image)) {
                Storage::disk('public')->delete($employee->image);
            }
            $data['image'] = $request->file('image')->store('employees/images', 'public');
        }

        if ($request->hasFile('appointment_letter')) {
            if (! empty($employee->appointment_letter) && Storage::disk('public')->exists($employee->appointment_letter)) {
                Storage::disk('public')->delete($employee->appointment_letter);
            }
            $data['appointment_letter'] = $request->file('appointment_letter')->store('employees/letters', 'public');
        }

        $employee->update($data);

        return redirect()->route('admin.employees.index')->with('success', "Employee '{$employee->name}' updated successfully.");
    }

    /**
     * Remove the specified employee.
     */
    public function destroy(Employee $employee): RedirectResponse
    {
        $name = $employee->name;
        $employee->delete();

        return redirect()->route('admin.employees.index')->with('success', "Employee '{$name}' and all associated attendance records & files were removed.");
    }

    /**
     * Re-verify / change device: generates new link, clears device hash, sets status to 0.
     */
    public function resetVerification(Employee $employee): RedirectResponse
    {
        $token = $employee->resetForReverification();
        $verifyLink = url("/verify/{$token}");

        return back()->with([
            'success' => "Device reset successfully! New verification link generated.",
            'new_verification_link' => $verifyLink,
        ]);
    }
}
