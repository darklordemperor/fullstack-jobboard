<?php

namespace App\Models;

use App\Domain\JobListings\Enums\EmploymentType;
use App\Domain\JobListings\Enums\JobListingStatus;
use Database\Factories\JobListingFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'employer_id',
    'title',
    'description',
    'location',
    'employment_type',
    'category',
    'salary_minimum',
    'salary_maximum',
    'currency',
    'status',
    'published_at',
])]
class JobListing extends Model
{
    /** @use HasFactory<JobListingFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<User, $this>
     */
    public function employer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employer_id');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'employment_type' => EmploymentType::class,
            'status' => JobListingStatus::class,
            'published_at' => 'immutable_datetime',
            'salary_minimum' => 'integer',
            'salary_maximum' => 'integer',
        ];
    }
}
