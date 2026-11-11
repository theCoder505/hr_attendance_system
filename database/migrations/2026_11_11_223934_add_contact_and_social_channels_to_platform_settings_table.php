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
            $table->string('whatsapp_number', 64)->nullable()->after('default_monthly_fee');
            $table->string('contact_number', 64)->nullable()->after('whatsapp_number');
            $table->string('facebook_url', 255)->nullable()->after('contact_number');
            $table->string('youtube_url', 255)->nullable()->after('facebook_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('platform_settings', function (Blueprint $table) {
            $table->dropColumn([
                'whatsapp_number',
                'contact_number',
                'facebook_url',
                'youtube_url',
            ]);
        });
    }
};
