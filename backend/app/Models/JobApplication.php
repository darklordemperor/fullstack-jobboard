<?php

namespace App\Models;

use App\Domain\JobApplications\Enums\JobApplicationStatus;
use Database\Factories\JobApplicationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'job_listing_id',
    'applicant_id',
    'cover_letter',
    'resume_path',
    'resume_original_name',
    'resume_mime_type',
    'resume_size',
    'status',
    'status_changed_at',
    'withdrawn_at',
])]
class JobApplication extends Model
{
    /** @use HasFactory<JobApplicationFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<JobListing, $this>
     */
    public function jobListing(): BelongsTo
    {
        return $this->belongsTo(JobListing::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function applicant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'applicant_id');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => JobApplicationStatus::class,
            'status_changed_at' => 'immutable_datetime',
            'withdrawn_at' => 'immutable_datetime',
            'resume_size' => 'integer',
        ];
    }
}
