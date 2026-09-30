<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('website_settings', function (Blueprint $table) {
            $table->id();
            $table->string('brandname')->default('AttendEase');
            $table->string('logo')->nullable();
            $table->string('favicon')->nullable();
            $table->time('office_starting_time')->default('09:00:00');
            $table->time('office_closing_time')->default('17:00:00');
            $table->string('office_ipv4_addr')->default('127.0.0.1');
            $table->integer('missing_checkout_early_leave_minutes')->default(60);
            $table->boolean('admin_login_2fa_enabled')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('website_settings');
    }
};
