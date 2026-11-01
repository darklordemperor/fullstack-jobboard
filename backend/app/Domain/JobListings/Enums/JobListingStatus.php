<?php

namespace App\Domain\JobListings\Enums;

enum JobListingStatus: string
{
    case Draft = 'draft';
    case Published = 'published';
    case Closed = 'closed';
}
