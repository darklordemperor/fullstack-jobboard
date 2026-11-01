<?php

namespace App\Application\JobListings\Exceptions;

use RuntimeException;

final class JobListingAccessDenied extends RuntimeException
{
    public function __construct()
    {
        parent::__construct('You do not have permission to manage this job listing.');
    }
}
