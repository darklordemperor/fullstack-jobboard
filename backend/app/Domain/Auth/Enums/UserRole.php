<?php

namespace App\Domain\Auth\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Employer = 'employer';
    case Jobseeker = 'jobseeker';
}
