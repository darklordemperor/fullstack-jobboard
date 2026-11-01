<?php

namespace App\Domain\JobListings\ValueObjects;

use InvalidArgumentException;

final readonly class SalaryRange
{
    public function __construct(
        public int $minimum,
        public int $maximum,
    ) {
        if ($minimum < 0) {
            throw new InvalidArgumentException('Minimum salary cannot be negative.');
        }

        if ($maximum < $minimum) {
            throw new InvalidArgumentException('Maximum salary must be greater than or equal to minimum salary.');
        }
    }
}
