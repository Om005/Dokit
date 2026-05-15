# docker/nginx/Dockerfile
FROM nginx:alpine

COPY nginx.conf.template /etc/nginx/templates/nginx.conf.template
CMD ["/bin/sh", "-c", "envsubst '$BACKEND_URL $DOMAIN $DOMAIN_ESCAPED' < /etc/nginx/templates/nginx.conf.template > /etc/nginx/nginx.conf && nginx -g 'daemon off;'"]


EXPOSE 80