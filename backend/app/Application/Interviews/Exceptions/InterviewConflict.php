<?php

namespace App\Application\Interviews\Exceptions;

use RuntimeException;

final class InterviewConflict extends RuntimeException
{
    public function __construct()
    {
        parent::__construct('The employer or candidate already has an overlapping interview.');
    }
}
