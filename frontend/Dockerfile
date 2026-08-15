
# step 1: build with Node.js

# use Node 20 (the current LTS version, correct for Vite)
FROM node:20-alpine AS build

# set up the working folder in the container
WORKDIR /app

# only copy the dependency files first
COPY package*.json ./

# install the React/Vite libraries
RUN npm install

# copy all the rest of the code (components, css, assets)
COPY . ./

# run the command of Vite to start the build
RUN npm run build



# step 2: production with Nginx

# start from an Nginx image
FROM nginx:alpine

# remove the default Nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# copy the files compiled from Phase 1 (dist/) into the Nginx public folder
COPY --from=build /app/dist /usr/share/nginx/html

# copy the custom configuration for routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# expose port 80 (standard for HTTP web traffic)
EXPOSE 80

# Starting Nginx by locking it in the foreground (required by Docker)
CMD ["nginx", "-g", "daemon off;"]