<?php

namespace App\Application\JobApplications\Exceptions;

use RuntimeException;

final class JobApplicationAccessDenied extends RuntimeException
{
    public function __construct()
    {
        parent::__construct('You do not have access to this job application.');
    }
}
