<?php

namespace App\Application\Auth\Exceptions;

use DomainException;

final class AccountSuspended extends DomainException
{
    public function __construct()
    {
        parent::__construct('Your account has been suspended. Please contact support.');
    }
}
