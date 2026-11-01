<?php

namespace App\Domain\Admin\ValueObjects;

use InvalidArgumentException;

final readonly class AdminMetric
{
    public function __construct(
        public int $value,
        public ?float $changePercent,
    ) {
        if ($value < 0) {
            throw new InvalidArgumentException('Metric values cannot be negative.');
        }
    }
}
