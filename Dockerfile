FROM ${CI_DEPENDENCY_PROXY_GROUP_IMAGE_PREFIX_SLASH}nginx:stable-alpine

# setup NGINX
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

ADD dist /usr/share/nginx/html

# start NGINX
CMD ["nginx", "-g", "daemon off;"]