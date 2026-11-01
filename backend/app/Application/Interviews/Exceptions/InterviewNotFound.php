<?php

namespace App\Application\Interviews\Exceptions;

use RuntimeException;

final class InterviewNotFound extends RuntimeException
{
    public function __construct()
    {
        parent::__construct('Interview not found.');
    }
}
