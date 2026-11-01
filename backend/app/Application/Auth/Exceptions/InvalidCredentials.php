<?php

namespace App\Application\Auth\Exceptions;

use DomainException;

final class InvalidCredentials extends DomainException
{
    public function __construct()
    {
        parent::__construct('The provided credentials do not match our records.');
    }
}
