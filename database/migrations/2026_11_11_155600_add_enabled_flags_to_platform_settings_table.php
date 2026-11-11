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
        Schema::table('platform_settings', function (Blueprint $table) {
            $table->boolean('bkash_enabled')->default(true)->after('bkash_type');
            $table->boolean('nagad_enabled')->default(true)->after('nagad_type');
            $table->boolean('bank_enabled')->default(true)->after('bank_routing');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('platform_settings', function (Blueprint $table) {
            $table->dropColumn(['bkash_enabled', 'nagad_enabled', 'bank_enabled']);
        });
    }
};
