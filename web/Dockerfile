# setup image base using node 22
FROM node:22

# set working directory in the container
WORKDIR /app

# copy the app package.json & package-lock.json
COPY package*.json ./

# copy local directories to the current local directory of docker image (/app)
# COPY ./src ./src
# COPY ./public ./public

# install the app dependencies
RUN npm install

# copy the rest of application code
COPY . .

# expose the port runs on
EXPOSE 8080

# run the application
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "8080"]