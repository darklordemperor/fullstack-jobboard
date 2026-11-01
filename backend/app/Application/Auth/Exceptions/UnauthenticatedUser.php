<?php

namespace App\Application\Auth\Exceptions;

use DomainException;

final class UnauthenticatedUser extends DomainException
{
    public function __construct()
    {
        parent::__construct('Unauthenticated.');
    }
}
