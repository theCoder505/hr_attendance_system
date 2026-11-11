<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $appTimezone = config('app.timezone', 'Asia/Dhaka');
        $today = \Carbon\Carbon::today($appTimezone)->toDateString();

        return [
            'employee_id' => ['required', 'exists:employees,id'],
            'date' => ['required', 'date', 'before_or_equal:' . $today],
            'check_in_time' => ['required', 'string'],
            'check_out_time' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'date.before_or_equal' => 'Attendance cannot be added for future dates. You can only record attendance for today or past days.',
        ];
    }
}
