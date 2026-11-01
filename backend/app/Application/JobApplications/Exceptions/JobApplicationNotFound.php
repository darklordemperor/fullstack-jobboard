<?php

namespace App\Application\JobApplications\Exceptions;

use RuntimeException;

final class JobApplicationNotFound extends RuntimeException
{
    public function __construct()
    {
        parent::__construct('Job application not found.');
    }
}
