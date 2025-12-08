FROM openresty/openresty:alpine

# Copy base nginx configuration
COPY nginx.conf /usr/local/openresty/nginx/conf/nginx.conf

# Copy Lua scripts
COPY lua /etc/nginx/lua

# Create required directories
RUN mkdir -p /etc/nginx/conf.d /var/log/openresty

EXPOSE 80

CMD ["openresty", "-g", "daemon off;"]
