<?php

namespace App\Domain\Admin\ValueObjects;

use InvalidArgumentException;

final readonly class AdminGrowthPoint
{
    public function __construct(
        public string $month,
        public int $newUsers,
        public int $newJobListings,
        public int $applications,
    ) {
        if (preg_match('/^\d{4}-\d{2}$/', $month) !== 1) {
            throw new InvalidArgumentException('Growth month must use YYYY-MM format.');
        }

        if ($newUsers < 0 || $newJobListings < 0 || $applications < 0) {
            throw new InvalidArgumentException('Growth counts cannot be negative.');
        }
    }
}
