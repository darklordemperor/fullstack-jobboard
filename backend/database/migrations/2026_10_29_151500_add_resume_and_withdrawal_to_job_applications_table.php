<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_applications', function (Blueprint $table) {
            $table->string('resume_path')->nullable()->after('cover_letter');
            $table->string('resume_original_name')->nullable()->after('resume_path');
            $table->string('resume_mime_type', 100)->nullable()->after('resume_original_name');
            $table->unsignedBigInteger('resume_size')->nullable()->after('resume_mime_type');
            $table->timestamp('withdrawn_at')->nullable()->after('status_changed_at');

            $table->index(['applicant_id', 'status', 'updated_at']);
        });
    }

    public function down(): void
    {
        Schema::table('job_applications', function (Blueprint $table) {
            $table->dropIndex(['applicant_id', 'status', 'updated_at']);
            $table->dropColumn([
                'resume_path',
                'resume_original_name',
                'resume_mime_type',
                'resume_size',
                'withdrawn_at',
            ]);
        });
    }
};
