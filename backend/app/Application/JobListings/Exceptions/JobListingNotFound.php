<?php

namespace App\Application\JobListings\Exceptions;

use RuntimeException;

final class JobListingNotFound extends RuntimeException
{
    public function __construct()
    {
        parent::__construct('Job listing not found.');
    }
}
