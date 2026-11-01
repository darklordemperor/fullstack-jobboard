<?php

namespace App\Domain\Auth\ValueObjects;

use InvalidArgumentException;

final readonly class UserName
{
    public string $value;

    public function __construct(string $value)
    {
        $normalized = trim($value);

        if ($normalized === '' || strlen($normalized) > 255) {
            throw new InvalidArgumentException('The user name must contain between 1 and 255 characters.');
        }

        $this->value = $normalized;
    }
}
