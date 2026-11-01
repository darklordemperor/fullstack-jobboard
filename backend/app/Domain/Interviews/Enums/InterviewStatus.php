<?php

namespace App\Domain\Interviews\Enums;

enum InterviewStatus: string
{
    case Scheduled = 'scheduled';
    case Confirmed = 'confirmed';
    case Cancelled = 'cancelled';
    case Completed = 'completed';

    public function isActive(): bool
    {
        return in_array($this, [self::Scheduled, self::Confirmed], true);
    }
}
