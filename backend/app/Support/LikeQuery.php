<?php

namespace App\Support;

final class LikeQuery
{
    public static function escape(string $value): string
    {
        return str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $value);
    }

    public static function pattern(string $value): string
    {
        return '%' . self::escape($value) . '%';
    }
}
