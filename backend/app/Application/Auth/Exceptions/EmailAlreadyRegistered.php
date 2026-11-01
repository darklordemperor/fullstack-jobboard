<?php

namespace App\Application\Auth\Exceptions;

use DomainException;

final class EmailAlreadyRegistered extends DomainException
{
    public function __construct()
    {
        parent::__construct('An account already exists for this email address.');
    }
}
