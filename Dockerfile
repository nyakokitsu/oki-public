# Node image
FROM node:alpine
LABEL maintainer="nyako"


WORKDIR /usr/app
COPY ./ /usr/app

# Dont ask why i need old api key is just need
# Install some dependencies
RUN npm install

# Start command
CMD [ "npm","start" ]
