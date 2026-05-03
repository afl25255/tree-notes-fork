FROM nginx:alpine

# nginx:alpine runs envsubst on /etc/nginx/templates/*.template at startup
# (see /docker-entrypoint.d/20-envsubst-on-templates.sh) and writes the
# result to /etc/nginx/conf.d/. We use this to inject ${PORT} and ${API_UPSTREAM}.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# index.html already declares <meta name="treenotes-api-base" content="/api">,
# so no post-processing is required and the same html can be bind-mounted in
# docker-compose for live editing without losing the API base hint.
COPY . /usr/share/nginx/html
RUN rm -f /usr/share/nginx/html/Dockerfile \
          /usr/share/nginx/html/.dockerignore \
          /usr/share/nginx/html/nginx.conf \
          /usr/share/nginx/html/nginx.conf.template \
          /usr/share/nginx/html/railway.toml

# Defaults match docker-compose. On Railway, PORT is injected by the platform
# and API_UPSTREAM points at the API service via its private domain.
ENV PORT=80 \
    API_UPSTREAM=http://api:8000 \
    NGINX_ENVSUBST_FILTER="^(PORT|API_UPSTREAM)$"

EXPOSE 80
