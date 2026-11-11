<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'check_in_time' => ['required', 'string'],
            'check_out_time' => ['nullable', 'string'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $attendance = $this->route('attendance');
            $appTimezone = config('app.timezone', 'Asia/Dhaka');
            $today = \Carbon\Carbon::today($appTimezone)->toDateString();

            if ($attendance && $attendance->date > $today) {
                $validator->errors()->add('date', 'Attendance cannot be edited for future dates.');
            }
        });
    }
}
