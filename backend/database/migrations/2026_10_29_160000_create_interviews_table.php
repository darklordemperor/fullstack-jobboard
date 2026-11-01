<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('interviews', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('job_application_id')->constrained()->cascadeOnDelete();
            $table->foreignId('employer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('candidate_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('scheduled_at');
            $table->unsignedSmallInteger('duration_minutes');
            $table->string('timezone', 64);
            $table->string('location');
            $table->text('notes')->nullable();
            $table->string('status', 32)->default('scheduled');
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['employer_id', 'status', 'scheduled_at']);
            $table->index(['candidate_id', 'status', 'scheduled_at']);
            $table->index(['job_application_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interviews');
    }
};
