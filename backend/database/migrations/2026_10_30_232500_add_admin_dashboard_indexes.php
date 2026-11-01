<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->index('created_at', 'users_created_at_index');
            $table->index(['role', 'created_at'], 'users_role_created_at_index');
        });

        Schema::table('job_listings', function (Blueprint $table): void {
            $table->index('created_at', 'job_listings_created_at_index');
        });

        Schema::table('job_applications', function (Blueprint $table): void {
            $table->index('created_at', 'job_applications_created_at_index');
            $table->index(['status', 'status_changed_at'], 'job_applications_status_changed_at_index');
        });
    }

    public function down(): void
    {
        Schema::table('job_applications', function (Blueprint $table): void {
            $table->dropIndex('job_applications_created_at_index');
            $table->dropIndex('job_applications_status_changed_at_index');
        });

        Schema::table('job_listings', function (Blueprint $table): void {
            $table->dropIndex('job_listings_created_at_index');
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->dropIndex('users_created_at_index');
            $table->dropIndex('users_role_created_at_index');
        });
    }
};
