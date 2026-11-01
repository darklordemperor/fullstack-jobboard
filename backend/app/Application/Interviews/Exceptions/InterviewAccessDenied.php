<?php

namespace App\Application\Interviews\Exceptions;

use RuntimeException;

final class InterviewAccessDenied extends RuntimeException
{
    public function __construct()
    {
        parent::__construct('You do not have access to this interview.');
    }
}
