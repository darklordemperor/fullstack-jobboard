<?php

namespace App\Domain\JobApplications\Enums;

enum JobApplicationStatus: string
{
    case Submitted = 'submitted';
    case Reviewing = 'reviewing';
    case Shortlisted = 'shortlisted';
    case Rejected = 'rejected';
    case Hired = 'hired';
    case Withdrawn = 'withdrawn';

    /**
     * @return list<self>
     */
    public static function employerManagedCases(): array
    {
        return [
            self::Submitted,
            self::Reviewing,
            self::Shortlisted,
            self::Rejected,
            self::Hired,
        ];
    }
}
