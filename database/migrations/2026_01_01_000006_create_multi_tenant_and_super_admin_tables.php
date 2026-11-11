<?php

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
        // 1. Add store_id & max_outlets to admins table
        Schema::table('admins', function (Blueprint $table) {
            $table->string('store_id', 32)->nullable()->unique()->after('uid');
            $table->integer('max_outlets')->default(5)->after('session_time');
        });

        // 2. Populate store_id for any existing admin
        $existingAdmins = DB::table('admins')->get();
        foreach ($existingAdmins as $admin) {
            $storeId = 'STR-' . strtoupper(Str::random(6));
            DB::table('admins')->where('id', $admin->id)->update([
                'store_id' => $storeId,
            ]);
        }

        // 3. Create super_admins table
        Schema::create('super_admins', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('otp', 10)->nullable();
            $table->timestamp('otp_expires_at')->nullable();
            $table->integer('session_time')->default(30);
            $table->rememberToken();
            $table->timestamps();
        });

        // 4. Add admin_id foreign keys to outlets, employees, attendances, and website_settings
        Schema::table('outlets', function (Blueprint $table) {
            $table->foreignId('admin_id')->nullable()->after('id')->constrained('admins')->cascadeOnDelete();
        });

        Schema::table('employees', function (Blueprint $table) {
            $table->foreignId('admin_id')->nullable()->after('id')->constrained('admins')->cascadeOnDelete();
        });

        Schema::table('attendances', function (Blueprint $table) {
            $table->foreignId('admin_id')->nullable()->after('id')->constrained('admins')->cascadeOnDelete();
        });

        Schema::table('website_settings', function (Blueprint $table) {
            $table->foreignId('admin_id')->nullable()->after('id')->constrained('admins')->cascadeOnDelete();
        });

        // If there was an existing admin, associate existing records to admin_id = 1
        $firstAdmin = DB::table('admins')->first();
        if ($firstAdmin) {
            DB::table('outlets')->whereNull('admin_id')->update(['admin_id' => $firstAdmin->id]);
            DB::table('employees')->whereNull('admin_id')->update(['admin_id' => $firstAdmin->id]);
            DB::table('attendances')->whereNull('admin_id')->update(['admin_id' => $firstAdmin->id]);
            DB::table('website_settings')->whereNull('admin_id')->update(['admin_id' => $firstAdmin->id]);
        }

        // 5. Create contact_inquiries table
        Schema::create('contact_inquiries', function (Blueprint $table) {
            $table->id();
            $table->string('company_name');
            $table->string('subject');
            $table->string('email');
            $table->string('phone');
            $table->integer('total_outlets')->default(1);
            $table->integer('avg_employees_per_outlet')->default(5);
            $table->text('message');
            $table->string('status', 20)->default('pending'); // 'pending', 'replied'
            $table->text('reply_message')->nullable();
            $table->timestamp('replied_at')->nullable();
            $table->foreignId('replied_by')->nullable()->constrained('super_admins')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contact_inquiries');

        Schema::table('website_settings', function (Blueprint $table) {
            $table->dropForeign(['admin_id']);
            $table->dropColumn('admin_id');
        });

        Schema::table('attendances', function (Blueprint $table) {
            $table->dropForeign(['admin_id']);
            $table->dropColumn('admin_id');
        });

        Schema::table('employees', function (Blueprint $table) {
            $table->dropForeign(['admin_id']);
            $table->dropColumn('admin_id');
        });

        Schema::table('outlets', function (Blueprint $table) {
            $table->dropForeign(['admin_id']);
            $table->dropColumn('admin_id');
        });

        Schema::dropIfExists('super_admins');

        Schema::table('admins', function (Blueprint $table) {
            $table->dropColumn(['store_id', 'max_outlets']);
        });
    }
};

