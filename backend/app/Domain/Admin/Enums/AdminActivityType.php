<?php

namespace App\Domain\Admin\Enums;

enum AdminActivityType: string
{
    case UserRegistered = 'user_registered';
    case JobPublished = 'job_published';
    case ApplicationSubmitted = 'application_submitted';
    case CandidateHired = 'candidate_hired';
}
