<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('office_ipv4_addr')) {
            $addr = $this->input('office_ipv4_addr');
            if (is_array($addr)) {
                $filtered = array_slice(array_filter(array_map('trim', $addr)), 0, 5);
                $addr = implode(', ', $filtered);
            } elseif (is_string($addr)) {
                $filtered = array_slice(array_filter(array_map('trim', explode(',', $addr))), 0, 5);
                $addr = implode(', ', $filtered);
            }

            $this->merge([
                'office_ipv4_addr' => $addr,
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'brandname' => ['required', 'string', 'max:255'],
            'office_starting_time' => ['required', 'string'],
            'office_closing_time' => ['required', 'string'],
            'office_ipv4_addr' => ['required', 'string', 'max:255'],
            'missing_checkout_early_leave_minutes' => ['required', 'integer', 'min:0', 'max:720'],
            'admin_login_2fa_enabled' => ['nullable', 'boolean'],
            'logo' => ['nullable', 'image', 'mimes:png,jpg,jpeg,svg,webp', 'max:2048'],
            'favicon' => ['nullable', 'file', 'mimes:ico,png,jpg,jpeg,svg,webp', 'max:1024'],
        ];
    }
}
