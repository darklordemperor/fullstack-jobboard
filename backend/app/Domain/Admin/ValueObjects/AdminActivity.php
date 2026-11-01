<?php

namespace App\Domain\Admin\ValueObjects;

use App\Domain\Admin\Enums\AdminActivityType;
use DateTimeImmutable;

final readonly class AdminActivity
{
    public function __construct(
        public AdminActivityType $type,
        public string $description,
        public DateTimeImmutable $occurredAt,
    ) {}
}
