<?php

namespace App\Infrastructure\Persistence\Eloquent;

use App\Domain\JobListings\Entities\JobListing as JobListingEntity;
use App\Domain\JobListings\Enums\EmploymentType;
use App\Domain\JobListings\Enums\JobListingStatus;
use App\Domain\JobListings\Repositories\JobListingRepository;
use App\Domain\JobListings\ValueObjects\JobListingFacets;
use App\Domain\JobListings\ValueObjects\JobListingPage;
use App\Domain\JobListings\ValueObjects\JobListingSearchCriteria;
use App\Domain\JobListings\ValueObjects\JobListingStatusCounts;
use App\Domain\JobListings\ValueObjects\SalaryRange;
use App\Models\JobListing as JobListingModel;
use App\Support\LikeQuery;
use DateTimeImmutable;
use Illuminate\Database\Eloquent\Builder;

final class EloquentJobListingRepository implements JobListingRepository
{
    public function searchPublished(JobListingSearchCriteria $criteria): JobListingPage
    {
        $query = JobListingModel::query()
            ->with('employer:id,name')
            ->where('status', JobListingStatus::Published->value)
            ->when($criteria->keyword, function (Builder $query, string $keyword): void {
                $pattern = LikeQuery::pattern($keyword);
                $query->where(function (Builder $query) use ($pattern): void {
                    $query->whereRaw("title LIKE ? ESCAPE '\\'", [$pattern])
                        ->orWhereRaw("category LIKE ? ESCAPE '\\'", [$pattern])
                        ->orWhereHas('employer', fn (Builder $employerQuery) => $employerQuery->whereRaw("name LIKE ? ESCAPE '\\'", [$pattern]));
                });
            })
            ->when($criteria->location, fn (Builder $query, string $location) => $query->where('location', $location))
            ->when($criteria->employmentTypes !== [], fn (Builder $query) => $query->whereIn(
                'employment_type',
                array_map(fn (EmploymentType $type): string => $type->value, $criteria->employmentTypes),
            ))
            ->when($criteria->salaryCap, fn (Builder $query, int $salaryCap) => $query->where('salary_minimum', '<=', $salaryCap))
            ->when($criteria->category, fn (Builder $query, string $category) => $query->where('category', $category))
            ->when($criteria->savedByUserId !== null, function (Builder $query) use ($criteria): void {
                $query->whereIn('id', function ($subquery) use ($criteria): void {
                    $subquery->select('job_listing_id')
                        ->from('saved_job_listings')
                        ->where('user_id', $criteria->savedByUserId);
                });
            });

        match ($criteria->sort) {
            'salary_desc' => $query->orderByDesc('salary_maximum')->orderByDesc('id'),
            default => $query->orderByDesc('published_at')->orderByDesc('id'),
        };

        $paginator = $query->paginate(
            perPage: $criteria->perPage,
            columns: ['*'],
            pageName: 'page',
            page: $criteria->page,
        );

        return new JobListingPage(
            items: array_values(array_map($this->toEntity(...), $paginator->items())),
            currentPage: $paginator->currentPage(),
            perPage: $paginator->perPage(),
            lastPage: $paginator->lastPage(),
            total: $paginator->total(),
        );
    }

    public function searchByEmployer(
        int $employerId,
        ?JobListingStatus $status,
        int $page,
        int $perPage,
        ?string $search = null,
    ): JobListingPage {
        $paginator = JobListingModel::query()
            ->with('employer:id,name')
            ->withCount([
                'applications',
                'applications as shortlisted_applications_count' => fn (Builder $query) => $query->where('status', 'shortlisted'),
            ])
            ->where('employer_id', $employerId)
            ->when($status, fn (Builder $query, JobListingStatus $status) => $query->where('status', $status->value))
            ->when($search !== null && $search !== '', function (Builder $query) use ($search): void {
                $pattern = LikeQuery::pattern($search);
                $query->where(function (Builder $nested) use ($pattern): void {
                    $nested->whereRaw("title LIKE ? ESCAPE '\\'", [$pattern])
                        ->orWhereRaw("location LIKE ? ESCAPE '\\'", [$pattern])
                        ->orWhereRaw("category LIKE ? ESCAPE '\\'", [$pattern]);
                });
            })
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->paginate(
                perPage: $perPage,
                columns: ['*'],
                pageName: 'page',
                page: $page,
            );

        return new JobListingPage(
            items: array_values(array_map($this->toEntity(...), $paginator->items())),
            currentPage: $paginator->currentPage(),
            perPage: $paginator->perPage(),
            lastPage: $paginator->lastPage(),
            total: $paginator->total(),
        );
    }

    public function statusCountsByEmployer(int $employerId): JobListingStatusCounts
    {
        $counts = JobListingModel::query()
            ->where('employer_id', $employerId)
            ->selectRaw('COUNT(*) as total')
            ->selectRaw("SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft")
            ->selectRaw("SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published")
            ->selectRaw("SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed")
            ->first();

        return new JobListingStatusCounts(
            total: (int) ($counts?->total ?? 0),
            draft: (int) ($counts?->draft ?? 0),
            published: (int) ($counts?->published ?? 0),
            closed: (int) ($counts?->closed ?? 0),
        );
    }

    public function facets(): JobListingFacets
    {
        $published = fn () => JobListingModel::query()->where('status', JobListingStatus::Published->value);

        return new JobListingFacets(
            locations: $published()->select('location')->distinct()->orderBy('location')->pluck('location')->all(),
            employmentTypes: EmploymentType::cases(),
            categories: $published()->select('category')->distinct()->orderBy('category')->pluck('category')->all(),
        );
    }

    public function findById(int $id): ?JobListingEntity
    {
        $model = JobListingModel::query()->with('employer:id,name')->find($id);

        return $model === null ? null : $this->toEntity($model);
    }

    public function findPublishedById(int $id): ?JobListingEntity
    {
        $model = JobListingModel::query()
            ->with('employer:id,name')
            ->where('status', JobListingStatus::Published->value)
            ->find($id);

        return $model === null ? null : $this->toEntity($model);
    }

    public function create(
        int $employerId,
        string $title,
        string $description,
        string $location,
        EmploymentType $employmentType,
        string $category,
        SalaryRange $salary,
        string $currency,
    ): JobListingEntity {
        $model = JobListingModel::query()->create([
            'employer_id' => $employerId,
            'title' => $title,
            'description' => $description,
            'location' => $location,
            'employment_type' => $employmentType,
            'category' => $category,
            'salary_minimum' => $salary->minimum,
            'salary_maximum' => $salary->maximum,
            'currency' => $currency,
            'status' => JobListingStatus::Draft,
        ])->load('employer:id,name');

        return $this->toEntity($model);
    }

    public function save(JobListingEntity $jobListing): JobListingEntity
    {
        $model = JobListingModel::query()->findOrFail($jobListing->id);
        $model->update([
            'title' => $jobListing->title,
            'description' => $jobListing->description,
            'location' => $jobListing->location,
            'employment_type' => $jobListing->employmentType,
            'category' => $jobListing->category,
            'salary_minimum' => $jobListing->salary->minimum,
            'salary_maximum' => $jobListing->salary->maximum,
            'currency' => $jobListing->currency,
            'status' => $jobListing->status,
            'published_at' => $jobListing->publishedAt,
        ]);

        return $this->toEntity($model->refresh()->load('employer:id,name'));
    }

    private function toEntity(JobListingModel $model): JobListingEntity
    {
        return new JobListingEntity(
            id: (int) $model->getKey(),
            employerId: (int) $model->employer_id,
            employerName: $model->employer->name,
            title: $model->title,
            description: $model->description,
            location: $model->location,
            employmentType: $model->employment_type,
            category: $model->category,
            salary: new SalaryRange($model->salary_minimum, $model->salary_maximum),
            currency: $model->currency,
            status: $model->status,
            publishedAt: $model->published_at === null ? null : DateTimeImmutable::createFromInterface($model->published_at),
            createdAt: DateTimeImmutable::createFromInterface($model->created_at),
            updatedAt: DateTimeImmutable::createFromInterface($model->updated_at),
            applicationsCount: (int) ($model->applications_count ?? 0),
            shortlistedCount: (int) ($model->shortlisted_applications_count ?? 0),
        );
    }
}
