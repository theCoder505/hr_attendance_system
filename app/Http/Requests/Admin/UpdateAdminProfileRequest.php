<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAdminProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'session_time' => ['required', 'integer', 'min:5', 'max:1440'],
            'two_factor_enabled' => ['nullable', 'boolean'],
        ];
    }
}
