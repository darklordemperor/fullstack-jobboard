#!/usr/bin/env sh
set -e

if [ ! -d vendor ]; then
    composer install
fi

mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs
chmod -R ug+rwX storage bootstrap/cache

php artisan migrate --force
php artisan db:seed --force

php-fpm -D
nginx -g "daemon off;"
