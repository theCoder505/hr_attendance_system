<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'brandname' => ['required', 'string', 'max:255'],
            'office_starting_time' => ['required', 'string'],
            'office_closing_time' => ['required', 'string'],
            'office_ipv4_addr' => ['required', 'string', 'max:100'],
            'missing_checkout_early_leave_minutes' => ['required', 'integer', 'min:0', 'max:720'],
            'admin_login_2fa_enabled' => ['nullable', 'boolean'],
            'logo' => ['nullable', 'image', 'mimes:png,jpg,jpeg,svg,webp', 'max:2048'],
            'favicon' => ['nullable', 'image', 'mimes:ico,png,jpg,svg', 'max:1024'],
        ];
    }
}
