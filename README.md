# DatingApp

## Настройка ssl
#### mkdir nginx/ssl
#### openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ./nginx/ssl/selfsigned.key -out ./nginx/ssl/selfsigned.crt -subj "/C=RU/ST=State/L=City/O=Organization/OU=Department/CN=${vps_ip}"

## Настройка сервисов
#### в каждой дирректории на уровнях .env.example по подобию создать файлы .env
