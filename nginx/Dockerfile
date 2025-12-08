FROM openresty/openresty:alpine

# Copy base nginx configuration
COPY nginx.conf /usr/local/openresty/nginx/conf/nginx.conf

# Copy Lua scripts
COPY lua /etc/nginx/lua

# Create conf.d directory
RUN mkdir -p /etc/nginx/conf.d

EXPOSE 80

CMD ["openresty", "-g", "daemon off;"]
