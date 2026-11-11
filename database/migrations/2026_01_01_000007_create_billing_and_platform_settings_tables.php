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
        // 1. Platform Settings (Receiving Payment accounts, Due day, User Manual content)
        Schema::create('platform_settings', function (Blueprint $table) {
            $table->id();
            $table->string('bkash_number')->nullable()->default('01700000000');
            $table->string('bkash_type')->default('Personal'); // Personal / Merchant / Agent
            $table->string('nagad_number')->nullable()->default('01800000000');
            $table->string('nagad_type')->default('Personal');
            $table->string('bank_name')->nullable()->default('City Bank PLC');
            $table->string('bank_account_name')->nullable()->default('AttendEase Tech');
            $table->string('bank_account_number')->nullable()->default('1102233445501');
            $table->string('bank_branch')->nullable()->default('Gulshan Branch, Dhaka');
            $table->string('bank_routing')->nullable()->default('225272635');
            $table->unsignedTinyInteger('payment_due_day')->default(7); // 1-31, default 7th of every month
            $table->decimal('default_monthly_fee', 10, 2)->default(500.00);
            $table->longText('user_manual_content')->nullable();
            $table->timestamps();
        });

        // 2. Add Lifetime Free & Custom Fee flags to Store Admins
        Schema::table('admins', function (Blueprint $table) {
            $table->boolean('is_lifetime_free')->default(false)->after('max_outlets');
            $table->decimal('monthly_fee', 10, 2)->nullable()->default(500.00)->after('is_lifetime_free');
        });

        // 3. Store Invoices
        Schema::create('store_invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_id')->constrained('admins')->cascadeOnDelete();
            $table->string('invoice_number', 64)->unique();
            $table->string('billing_month', 7); // Format: YYYY-MM
            $table->decimal('amount', 10, 2);
            $table->date('due_date');
            $table->string('status', 32)->default('unpaid'); // unpaid, pending_verification, paid, rejected
            $table->string('payment_method', 32)->nullable(); // bkash, nagad, bank
            $table->string('transaction_id', 128)->nullable();
            $table->string('payment_time', 128)->nullable();
            $table->text('payment_note')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('super_admins')->nullOnDelete();
            $table->timestamps();

            $table->index(['admin_id', 'billing_month']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('store_invoices');
        Schema::table('admins', function (Blueprint $table) {
            $table->dropColumn(['is_lifetime_free', 'monthly_fee']);
        });
        Schema::dropIfExists('platform_settings');
    }
};

