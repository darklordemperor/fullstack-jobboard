FROM php:8.4-fpm

WORKDIR /var/www/html

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    git \
    nginx \
    unzip \
    libsqlite3-dev \
    libzip-dev \
    && docker-php-ext-install \
    bcmath \
    pcntl \
    pdo_mysql \
    pdo_sqlite \
    zip \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY docker/laravel/nginx.conf /etc/nginx/sites-available/default
COPY docker/laravel/start-container.sh /usr/local/bin/start-container

RUN chmod +x /usr/local/bin/start-container

EXPOSE 80

CMD ["start-container"]
