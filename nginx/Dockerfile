# Используем Alpine для меньшего размера образа
FROM nginx:alpine

# Устанавливаем зависимости для сборки nginx с Brotli
RUN apk add --no-cache --virtual .build-deps \
    build-base \
    linux-headers \
    pcre-dev \
    zlib-dev \
    libc-dev \
    wget \
    git \
    && apk add --no-cache \
    pcre \
    zlib

# Скачиваем и собираем nginx с модулем Brotli
WORKDIR /tmp

# Скачиваем исходники nginx (обновлено до 1.25.5)
RUN wget http://nginx.org/download/nginx-1.25.5.tar.gz \
    && tar -xzf nginx-1.25.5.tar.gz

# Скачиваем модуль Brotli
RUN git clone https://github.com/google/ngx_brotli.git

# Скачиваем библиотеку Brotli
RUN git clone https://github.com/google/brotli.git

# Собираем библиотеку Brotli
WORKDIR /tmp/brotli
RUN mkdir out && cd out \
    && cmake -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=OFF .. \
    && make -j$(nproc)

# Собираем nginx с модулем Brotli (без HTTP/3)
WORKDIR /tmp/nginx-1.25.5
RUN ./configure \
    --prefix=/etc/nginx \
    --sbin-path=/usr/sbin/nginx \
    --modules-path=/usr/lib/nginx/modules \
    --conf-path=/etc/nginx/nginx.conf \
    --error-log-path=/var/log/nginx/error.log \
    --http-log-path=/var/log/nginx/access.log \
    --pid-path=/var/run/nginx.pid \
    --lock-path=/var/run/nginx.lock \
    --http-client-body-temp-path=/var/cache/nginx/client_temp \
    --http-proxy-temp-path=/var/cache/nginx/proxy_temp \
    --http-fastcgi-temp-path=/var/cache/nginx/fastcgi_temp \
    --http-uwsgi-temp-path=/var/cache/nginx/uwsgi_temp \
    --http-scgi-temp-path=/var/cache/nginx/scgi_temp \
    --with-perl_modules_path=/usr/lib/perl5/vendor_perl \
    --user=nginx \
    --group=nginx \
    --with-compat \
    --with-file-aio \
    --with-threads \
    --with-http_addition_module \
    --with-http_auth_request_module \
    --with-http_dav_module \
    --with-http_flv_module \
    --with-http_gunzip_module \
    --with-http_gzip_static_module \
    --with-http_mp4_module \
    --with-http_random_index_module \
    --with-http_realip_module \
    --with-http_secure_link_module \
    --with-http_slice_module \
    --with-http_ssl_module \
    --with-http_stub_status_module \
    --with-http_sub_module \
    --with-http_v2_module \
    --with-mail \
    --with-mail_ssl_module \
    --with-stream \
    --with-stream_realip_module \
    --with-stream_ssl_module \
    --with-stream_ssl_preread_module \
    --add-module=/tmp/ngx_brotli \
    --with-ld-opt="-L/tmp/brotli/out" \
    && make -j$(nproc) \
    && make install

# Создаем необходимые директории
RUN mkdir -p /var/cache/nginx/client_temp \
    /var/cache/nginx/proxy_temp \
    /var/cache/nginx/fastcgi_temp \
    /var/cache/nginx/uwsgi_temp \
    /var/cache/nginx/scgi_temp \
    /var/cache/nginx/static \
    /var/cache/nginx/proxy \
    /var/cache/nginx/temp

# Копируем конфигурацию
COPY ./nginx.conf /etc/nginx/nginx.conf

# Очищаем временные файлы
RUN apk del .build-deps \
    && rm -rf /tmp/* \
    && rm -rf /var/cache/apk/*

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
