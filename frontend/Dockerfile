# Stage 1: Use Nginx as a static file server
FROM nginx:alpine

# Copy your frontend files into Nginx's default directory
COPY . /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Nginx runs automatically when container starts
