<?php

namespace App\Application\JobApplications\Exceptions;

use RuntimeException;

final class JobApplicationResumeNotFound extends RuntimeException
{
    public function __construct()
    {
        parent::__construct('No resume is attached to this application.');
    }
}
