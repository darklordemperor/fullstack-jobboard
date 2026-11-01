<?php

namespace App\Infrastructure\Persistence\Eloquent;

use App\Domain\Interviews\Entities\Interview as InterviewEntity;
use App\Domain\Interviews\Enums\InterviewStatus;
use App\Domain\Interviews\Repositories\InterviewRepository;
use App\Domain\Interviews\ValueObjects\InterviewPage;
use App\Domain\Interviews\ValueObjects\InterviewStatusCounts;
use App\Models\Interview as InterviewModel;
use DateTimeImmutable;
use DomainException;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

final class EloquentInterviewRepository implements InterviewRepository
{
    public function create(
        int $jobApplicationId,
        int $employerId,
        int $candidateId,
        DateTimeImmutable $scheduledAt,
        int $durationMinutes,
        string $timezone,
        string $location,
        ?string $notes,
    ): InterviewEntity {
        return DB::transaction(function () use (
            $jobApplicationId,
            $employerId,
            $candidateId,
            $scheduledAt,
            $durationMinutes,
            $timezone,
            $location,
            $notes,
        ): InterviewEntity {
            DB::table('users')
                ->whereIn('id', [$employerId, $candidateId])
                ->orderBy('id')
                ->lockForUpdate()
                ->get(['id']);

            $endsAt = $scheduledAt->modify("+{$durationMinutes} minutes");

            if ($this->hasActiveConflict($employerId, $candidateId, $scheduledAt, $endsAt)) {
                throw new DomainException('The employer or candidate already has an overlapping interview.');
            }

            $model = InterviewModel::query()->create([
                'job_application_id' => $jobApplicationId,
                'employer_id' => $employerId,
                'candidate_id' => $candidateId,
                'scheduled_at' => $scheduledAt,
                'duration_minutes' => $durationMinutes,
                'timezone' => $timezone,
                'location' => $location,
                'notes' => $notes,
                'status' => InterviewStatus::Scheduled,
            ]);

            return $this->toEntity($model->load($this->relations()));
        });
    }

    public function findById(int $id): ?InterviewEntity
    {
        $model = InterviewModel::query()->with($this->relations())->find($id);

        return $model === null ? null : $this->toEntity($model);
    }

    public function hasActiveConflict(
        int $employerId,
        int $candidateId,
        DateTimeImmutable $startsAt,
        DateTimeImmutable $endsAt,
        ?int $ignoreInterviewId = null,
    ): bool {
        return InterviewModel::query()
            ->whereIn('status', [InterviewStatus::Scheduled->value, InterviewStatus::Confirmed->value])
            ->where(fn (Builder $query) => $query
                ->where('employer_id', $employerId)
                ->orWhere('candidate_id', $candidateId))
            ->where('scheduled_at', '<', $endsAt)
            ->where('scheduled_at', '>', $startsAt->modify('-8 hours'))
            ->when($ignoreInterviewId, fn (Builder $query, int $id) => $query->whereKeyNot($id))
            ->get(['id', 'scheduled_at', 'duration_minutes'])
            ->contains(fn (InterviewModel $model) => DateTimeImmutable::createFromInterface($model->scheduled_at)
                ->modify("+{$model->duration_minutes} minutes") > $startsAt);
    }

    public function searchByEmployer(
        int $employerId,
        ?InterviewStatus $status,
        int $page,
        int $perPage,
    ): InterviewPage {
        return $this->paginate(
            InterviewModel::query()->where('employer_id', $employerId),
            $status,
            $page,
            $perPage,
        );
    }

    public function searchByCandidate(
        int $candidateId,
        ?InterviewStatus $status,
        int $page,
        int $perPage,
    ): InterviewPage {
        return $this->paginate(
            InterviewModel::query()->where('candidate_id', $candidateId),
            $status,
            $page,
            $perPage,
        );
    }

    public function save(InterviewEntity $interview): InterviewEntity
    {
        return DB::transaction(function () use ($interview): InterviewEntity {
            DB::table('users')
                ->whereIn('id', [$interview->employerId, $interview->candidateId])
                ->orderBy('id')
                ->lockForUpdate()
                ->get(['id']);

            $model = InterviewModel::query()->lockForUpdate()->findOrFail($interview->id);

            if ($interview->status->isActive() && $this->hasActiveConflict(
                $interview->employerId,
                $interview->candidateId,
                $interview->scheduledAt,
                $interview->endsAt(),
                $interview->id,
            )) {
                throw new DomainException('The employer or candidate already has an overlapping interview.');
            }

            $model->update([
                'scheduled_at' => $interview->scheduledAt,
                'duration_minutes' => $interview->durationMinutes,
                'timezone' => $interview->timezone,
                'location' => $interview->location,
                'notes' => $interview->notes,
                'status' => $interview->status,
                'confirmed_at' => $interview->confirmedAt,
                'cancelled_at' => $interview->cancelledAt,
                'completed_at' => $interview->completedAt,
            ]);

            return $this->toEntity($model->refresh()->load($this->relations()));
        });
    }

    /** @param Builder<InterviewModel> $query */
    private function paginate(
        Builder $query,
        ?InterviewStatus $status,
        int $page,
        int $perPage,
    ): InterviewPage {
        $counts = $this->statusCounts(clone $query);

        $paginator = $query
            ->with($this->relations())
            ->when($status, fn (Builder $builder, InterviewStatus $value) => $builder->where('status', $value->value))
            ->orderBy('scheduled_at')
            ->orderBy('id')
            ->paginate(
                perPage: $perPage,
                columns: ['*'],
                pageName: 'page',
                page: $page,
            );

        return new InterviewPage(
            items: array_values(array_map($this->toEntity(...), $paginator->items())),
            currentPage: $paginator->currentPage(),
            perPage: $paginator->perPage(),
            lastPage: $paginator->lastPage(),
            total: $paginator->total(),
            counts: $counts,
        );
    }

    /** @param Builder<InterviewModel> $query */
    private function statusCounts(Builder $query): InterviewStatusCounts
    {
        $counts = $query
            ->selectRaw('COUNT(*) as total')
            ->selectRaw("SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled")
            ->selectRaw("SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed")
            ->selectRaw("SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled")
            ->selectRaw("SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed")
            ->first();

        return new InterviewStatusCounts(
            total: (int) ($counts?->total ?? 0),
            scheduled: (int) ($counts?->scheduled ?? 0),
            confirmed: (int) ($counts?->confirmed ?? 0),
            cancelled: (int) ($counts?->cancelled ?? 0),
            completed: (int) ($counts?->completed ?? 0),
        );
    }

    /** @return array<int, string> */
    private function relations(): array
    {
        return [
            'jobApplication:id,job_listing_id,applicant_id',
            'jobApplication.jobListing:id,title',
            'employer:id,name',
            'candidate:id,name,email',
        ];
    }

    private function toEntity(InterviewModel $model): InterviewEntity
    {
        return new InterviewEntity(
            id: (int) $model->getKey(),
            jobApplicationId: (int) $model->job_application_id,
            jobListingId: (int) $model->jobApplication->job_listing_id,
            jobTitle: $model->jobApplication->jobListing->title,
            employerId: (int) $model->employer_id,
            employerName: $model->employer->name,
            candidateId: (int) $model->candidate_id,
            candidateName: $model->candidate->name,
            candidateEmail: $model->candidate->email,
            scheduledAt: DateTimeImmutable::createFromInterface($model->scheduled_at),
            durationMinutes: (int) $model->duration_minutes,
            timezone: $model->timezone,
            location: $model->location,
            notes: $model->notes,
            status: $model->status,
            confirmedAt: $model->confirmed_at === null ? null : DateTimeImmutable::createFromInterface($model->confirmed_at),
            cancelledAt: $model->cancelled_at === null ? null : DateTimeImmutable::createFromInterface($model->cancelled_at),
            completedAt: $model->completed_at === null ? null : DateTimeImmutable::createFromInterface($model->completed_at),
            createdAt: DateTimeImmutable::createFromInterface($model->created_at),
            updatedAt: DateTimeImmutable::createFromInterface($model->updated_at),
        );
    }
}
