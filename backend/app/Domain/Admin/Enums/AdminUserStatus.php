<?php

namespace App\Domain\Admin\Enums;

enum AdminUserStatus: string
{
    case Verified = 'verified';
    case Unverified = 'unverified';
    case Suspended = 'suspended';
}
