# Production PHP-FPM Image
FROM php:8.2-fpm-alpine

# Install production dependencies
RUN apk add --no-cache \
    nginx \
    libzip-dev \
    zip \
    unzip \
    git \
    oniguruma-dev \
    libpng-dev

# PHP Extensions
RUN docker-php-ext-install pdo_mysql mbstring zip gd

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# Copy source
COPY . .

# Permissions
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache /var/www/public/games

# Nginx Config
COPY .docker/nginx.conf /etc/nginx/http.d/default.conf

EXPOSE 80

CMD ["sh", "-c", "nginx && php-fpm"]
