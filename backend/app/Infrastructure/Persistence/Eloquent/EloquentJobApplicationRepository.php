<?php

namespace App\Infrastructure\Persistence\Eloquent;

use App\Domain\JobApplications\Entities\JobApplication as JobApplicationEntity;
use App\Domain\JobApplications\Enums\JobApplicationStatus;
use App\Domain\JobApplications\Repositories\JobApplicationRepository;
use App\Domain\JobApplications\ValueObjects\JobApplicationPage;
use App\Domain\JobApplications\ValueObjects\JobApplicationStatusCounts;
use App\Domain\JobApplications\ValueObjects\ResumeAttachment;
use App\Models\JobApplication as JobApplicationModel;
use App\Support\LikeQuery;
use DateTimeImmutable;
use DomainException;
use Illuminate\Database\Eloquent\Builder;

final class EloquentJobApplicationRepository implements JobApplicationRepository
{
    public function existsForApplicantAndJob(int $applicantId, int $jobListingId): bool
    {
        return JobApplicationModel::query()
            ->where('applicant_id', $applicantId)
            ->where('job_listing_id', $jobListingId)
            ->exists();
    }

    public function create(
        int $jobListingId,
        int $applicantId,
        string $coverLetter,
        ?ResumeAttachment $resume,
    ): JobApplicationEntity {
        $model = JobApplicationModel::query()->firstOrCreate([
            'job_listing_id' => $jobListingId,
            'applicant_id' => $applicantId,
        ], [
            'cover_letter' => $coverLetter,
            'resume_path' => $resume?->path,
            'resume_original_name' => $resume?->originalName,
            'resume_mime_type' => $resume?->mimeType,
            'resume_size' => $resume?->size,
            'status' => JobApplicationStatus::Submitted,
            'status_changed_at' => now(),
        ]);

        if (! $model->wasRecentlyCreated) {
            throw new DomainException('You have already applied to this job listing.');
        }

        return $this->toEntity($model->load($this->relations()));
    }

    public function searchByEmployerJob(
        int $employerId,
        int $jobListingId,
        ?JobApplicationStatus $status,
        int $page,
        int $perPage,
        ?string $search = null,
    ): JobApplicationPage {
        $paginator = $this->ownedJobQuery($employerId, $jobListingId)
            ->with($this->relations())
            ->when($status, fn (Builder $query, JobApplicationStatus $status) => $query->where('status', $status->value))
            ->when($search !== null && $search !== '', function (Builder $query) use ($search): void {
                $pattern = LikeQuery::pattern($search);
                $query->where(function (Builder $nested) use ($pattern): void {
                    $nested->whereRaw("cover_letter LIKE ? ESCAPE '\\'", [$pattern])
                        ->orWhereHas('applicant', function (Builder $applicantQuery) use ($pattern): void {
                            $applicantQuery->whereRaw("name LIKE ? ESCAPE '\\'", [$pattern])
                                ->orWhereRaw("email LIKE ? ESCAPE '\\'", [$pattern]);
                        });
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

        return new JobApplicationPage(
            items: array_values(array_map($this->toEntity(...), $paginator->items())),
            currentPage: $paginator->currentPage(),
            perPage: $paginator->perPage(),
            lastPage: $paginator->lastPage(),
            total: $paginator->total(),
        );
    }

    public function statusCountsByEmployerJob(int $employerId, int $jobListingId): JobApplicationStatusCounts
    {
        return $this->statusCounts($this->ownedJobQuery($employerId, $jobListingId));
    }

    public function searchByApplicant(
        int $applicantId,
        ?JobApplicationStatus $status,
        int $page,
        int $perPage,
        ?int $jobListingId = null,
        ?string $search = null,
    ): JobApplicationPage {
        $paginator = JobApplicationModel::query()
            ->with($this->relations())
            ->where('applicant_id', $applicantId)
            ->when($status, fn (Builder $query, JobApplicationStatus $status) => $query->where('status', $status->value))
            ->when($jobListingId !== null, fn (Builder $query) => $query->where('job_listing_id', $jobListingId))
            ->when($search !== null && $search !== '', function (Builder $query) use ($search): void {
                $pattern = LikeQuery::pattern($search);
                $query->where(function (Builder $nested) use ($pattern): void {
                    $nested->whereRaw("cover_letter LIKE ? ESCAPE '\\'", [$pattern])
                        ->orWhereHas('jobListing', function (Builder $jobQuery) use ($pattern): void {
                            $jobQuery->whereRaw("title LIKE ? ESCAPE '\\'", [$pattern])
                                ->orWhereRaw("location LIKE ? ESCAPE '\\'", [$pattern])
                                ->orWhereRaw("category LIKE ? ESCAPE '\\'", [$pattern]);
                        });
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

        return new JobApplicationPage(
            items: array_values(array_map($this->toEntity(...), $paginator->items())),
            currentPage: $paginator->currentPage(),
            perPage: $paginator->perPage(),
            lastPage: $paginator->lastPage(),
            total: $paginator->total(),
        );
    }

    public function statusCountsByApplicant(int $applicantId): JobApplicationStatusCounts
    {
        return $this->statusCounts(
            JobApplicationModel::query()->where('applicant_id', $applicantId),
        );
    }

    public function findById(int $id): ?JobApplicationEntity
    {
        $model = JobApplicationModel::query()->with($this->relations())->find($id);

        return $model === null ? null : $this->toEntity($model);
    }

    public function save(JobApplicationEntity $application): JobApplicationEntity
    {
        $model = JobApplicationModel::query()->findOrFail($application->id);
        $model->update([
            'status' => $application->status,
            'status_changed_at' => $application->statusChangedAt,
            'withdrawn_at' => $application->withdrawnAt,
        ]);

        return $this->toEntity($model->refresh()->load($this->relations()));
    }

    /**
     * @return Builder<JobApplicationModel>
     */
    private function ownedJobQuery(int $employerId, int $jobListingId): Builder
    {
        return JobApplicationModel::query()
            ->where('job_listing_id', $jobListingId)
            ->whereHas('jobListing', fn (Builder $query) => $query->where('employer_id', $employerId));
    }

    /**
     * @return array<int, string>
     */
    private function relations(): array
    {
        return ['jobListing:id,employer_id,title', 'applicant:id,name,email'];
    }

    /**
     * @param  Builder<JobApplicationModel>  $query
     */
    private function statusCounts(Builder $query): JobApplicationStatusCounts
    {
        $counts = $query
            ->selectRaw('COUNT(*) as total')
            ->selectRaw("SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted")
            ->selectRaw("SUM(CASE WHEN status = 'reviewing' THEN 1 ELSE 0 END) as reviewing")
            ->selectRaw("SUM(CASE WHEN status = 'shortlisted' THEN 1 ELSE 0 END) as shortlisted")
            ->selectRaw("SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected")
            ->selectRaw("SUM(CASE WHEN status = 'hired' THEN 1 ELSE 0 END) as hired")
            ->selectRaw("SUM(CASE WHEN status = 'withdrawn' THEN 1 ELSE 0 END) as withdrawn")
            ->first();

        return new JobApplicationStatusCounts(
            total: (int) ($counts?->total ?? 0),
            submitted: (int) ($counts?->submitted ?? 0),
            reviewing: (int) ($counts?->reviewing ?? 0),
            shortlisted: (int) ($counts?->shortlisted ?? 0),
            rejected: (int) ($counts?->rejected ?? 0),
            hired: (int) ($counts?->hired ?? 0),
            withdrawn: (int) ($counts?->withdrawn ?? 0),
        );
    }

    private function toEntity(JobApplicationModel $model): JobApplicationEntity
    {
        return new JobApplicationEntity(
            id: (int) $model->getKey(),
            jobListingId: (int) $model->job_listing_id,
            jobTitle: $model->jobListing->title,
            employerId: (int) $model->jobListing->employer_id,
            applicantId: (int) $model->applicant_id,
            applicantName: $model->applicant->name,
            applicantEmail: $model->applicant->email,
            coverLetter: $model->cover_letter,
            resume: $model->resume_path === null ? null : new ResumeAttachment(
                path: $model->resume_path,
                originalName: $model->resume_original_name,
                mimeType: $model->resume_mime_type,
                size: (int) $model->resume_size,
            ),
            status: $model->status,
            statusChangedAt: DateTimeImmutable::createFromInterface($model->status_changed_at),
            withdrawnAt: $model->withdrawn_at === null ? null : DateTimeImmutable::createFromInterface($model->withdrawn_at),
            createdAt: DateTimeImmutable::createFromInterface($model->created_at),
            updatedAt: DateTimeImmutable::createFromInterface($model->updated_at),
        );
    }
}
