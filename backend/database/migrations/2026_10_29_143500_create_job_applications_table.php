<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_listing_id')->constrained()->cascadeOnDelete();
            $table->foreignId('applicant_id')->constrained('users')->cascadeOnDelete();
            $table->text('cover_letter');
            $table->string('status', 32)->default('submitted');
            $table->timestamp('status_changed_at')->useCurrent();
            $table->timestamps();

            $table->unique(['job_listing_id', 'applicant_id']);
            $table->index(['job_listing_id', 'status', 'updated_at']);
            $table->index(['applicant_id', 'updated_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_applications');
    }
};
