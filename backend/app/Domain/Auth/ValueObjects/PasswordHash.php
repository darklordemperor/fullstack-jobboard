<?php

namespace App\Domain\Auth\ValueObjects;

use InvalidArgumentException;

final readonly class PasswordHash
{
    public function __construct(public string $value)
    {
        if ($value === '') {
            throw new InvalidArgumentException('A password hash is required.');
        }
    }
}
