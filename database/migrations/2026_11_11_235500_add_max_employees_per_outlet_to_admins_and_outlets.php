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
        Schema::table('admins', function (Blueprint $table) {
            $table->integer('max_employees_per_outlet')->default(25)->after('max_storage_mb');
        });

        Schema::table('outlets', function (Blueprint $table) {
            $table->integer('max_employees')->nullable()->after('wifi_ip');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('outlets', function (Blueprint $table) {
            $table->dropColumn('max_employees');
        });

        Schema::table('admins', function (Blueprint $table) {
            $table->dropColumn('max_employees_per_outlet');
        });
    }
};

