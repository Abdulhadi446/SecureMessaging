# Use official Node.js LTS image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your project
COPY . .

# Create .env file inside the container
RUN echo "\
MONGODB_URI=mongodb+srv://abdulhadijunaidahmedkhan:deaZzINyWXCjoE7o@cluster0.tlbdpmj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0\n\
MONGODB_DB=secure-messaging\n\
PORT=3000\n\
JWT_SECRET=your_very_secure_jwt_secret_here" \
> .env

# Expose the port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]