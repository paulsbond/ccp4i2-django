# Nginx Dockerfile for CCP4i2 - Updated 2025-09-18
FROM nginx:alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy additional configuration files
COPY conf.d/ /etc/nginx/conf.d/

# Copy SSL certificates if they exist
# COPY ssl/ /etc/nginx/ssl/

# Create directories for static and media files
RUN mkdir -p /usr/share/nginx/html/static /usr/share/nginx/html/media

# Expose ports
EXPOSE 80 443

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
