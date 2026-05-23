# GitLab exposes dependency proxy vars in CI, but Dockerfile FROM can only use
# values passed via a pre FROM ARG, so CI forwards this prefix with --build-arg
# This might not be needed but according to the Docker docs it is.
ARG CI_DEPENDENCY_PROXY_GROUP_IMAGE_PREFIX_SLASH=
FROM ${CI_DEPENDENCY_PROXY_GROUP_IMAGE_PREFIX_SLASH}nginx:stable-alpine

# setup NGINX
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

ADD dist /usr/share/nginx/html

# start NGINX
CMD ["nginx", "-g", "daemon off;"]