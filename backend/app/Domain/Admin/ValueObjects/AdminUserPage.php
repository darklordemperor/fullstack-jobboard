<?php

namespace App\Domain\Admin\ValueObjects;

final readonly class AdminUserPage
{
    /**
     * @param  list<AdminUserSummary>  $items
     */
    public function __construct(
        public array $items,
        public int $currentPage,
        public int $perPage,
        public int $lastPage,
        public int $total,
    ) {}
}
