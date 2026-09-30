<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:50'],
            'role' => ['required', 'string', 'max:100'],
            'work_desc' => ['nullable', 'string'],
            'salary' => ['required', 'numeric', 'min:0'],
            'working_hours' => ['required', 'numeric', 'min:1', 'max:24'],
            'check_in_time' => ['nullable', 'string'],
            'check_out_time' => ['nullable', 'string'],
            'joining_date' => ['required', 'date'],
            'image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:4096'],
            'appointment_letter' => ['nullable', 'file', 'mimes:pdf', 'max:10240'],
        ];
    }
}
