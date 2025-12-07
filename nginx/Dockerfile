FROM openresty/openresty:alpine

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy nginx configuration
COPY nginx.conf /usr/local/openresty/nginx/conf/nginx.conf

# Copy Lua scripts
COPY lua/ /etc/nginx/lua/

# Copy server configs
COPY conf.d/ /etc/nginx/conf.d/

# Create log directory
RUN mkdir -p /var/log/nginx

# Expose ports
EXPOSE 80 443

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

CMD ["openresty", "-g", "daemon off;"]
