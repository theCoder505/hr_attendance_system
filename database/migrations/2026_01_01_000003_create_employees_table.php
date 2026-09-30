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
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('uid')->unique();
            $table->string('name');
            $table->string('phone');
            $table->string('role');
            $table->text('work_desc')->nullable();
            $table->decimal('salary', 12, 2)->default(0);
            $table->decimal('working_hours', 5, 2)->default(8.00);
            $table->time('check_in_time');
            $table->time('check_out_time');
            $table->date('joining_date');
            $table->string('image')->nullable();
            $table->string('appointment_letter')->nullable();
            $table->tinyInteger('status')->default(0); // 0 = pending, 1 = verified/active
            $table->string('device_token_hash', 64)->nullable()->index();
            $table->timestamp('device_token_expires_at')->nullable();
            $table->string('verification_token', 64)->nullable()->unique();
            $table->timestamp('verification_expires_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
