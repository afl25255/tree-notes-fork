FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY . /usr/share/nginx/html
RUN rm -f /usr/share/nginx/html/nginx.conf

# Same-origin API base when UI is served from this container (see script.js getApiBase)
RUN awk '/<head>/ { print; print "    <meta name=\"treenotes-api-base\" content=\"/api\">"; next } { print }' \
    /usr/share/nginx/html/index.html > /tmp/tn_index.html \
    && mv /tmp/tn_index.html /usr/share/nginx/html/index.html

EXPOSE 80
