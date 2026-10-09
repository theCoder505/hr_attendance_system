<?php

use App\Models\WebsiteSetting;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('outlets', function (Blueprint $table) {
            $table->id();
            $table->string('uid', 32)->unique();
            $table->string('name');
            $table->string('wifi_ip');
            $table->timestamps();
        });

        Schema::table('employees', function (Blueprint $table) {
            $table->foreignId('outlet_id')->nullable()->after('id')->constrained('outlets')->cascadeOnDelete();
        });

        Schema::table('attendances', function (Blueprint $table) {
            $table->foreignId('outlet_id')->nullable()->after('employee_id')->constrained('outlets')->cascadeOnDelete();
        });

        // Seed default outlet from existing website setting if any exists
        $settings = DB::table('website_settings')->first();
        $defaultIp = '127.0.0.1';
        if ($settings && ! empty($settings->office_ipv4_addr)) {
            $ips = array_map('trim', explode(',', $settings->office_ipv4_addr));
            $defaultIp = $ips[0] ?? '127.0.0.1';
        }

        $outletId = DB::table('outlets')->insertGetId([
            'uid' => 'OUT-' . strtoupper(Str::random(6)),
            'name' => 'Main Office',
            'wifi_ip' => $defaultIp,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Assign existing employees & attendances to this default outlet
        DB::table('employees')->whereNull('outlet_id')->update(['outlet_id' => $outletId]);
        DB::table('attendances')->whereNull('outlet_id')->update(['outlet_id' => $outletId]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropForeign(['outlet_id']);
            $table->dropColumn('outlet_id');
        });

        Schema::table('employees', function (Blueprint $table) {
            $table->dropForeign(['outlet_id']);
            $table->dropColumn('outlet_id');
        });

        Schema::dropIfExists('outlets');
    }
};
