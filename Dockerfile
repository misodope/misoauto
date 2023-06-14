# Use an official Node.js runtime as a parent image
FROM node:18

ENV VERCEL_ACCESS_TOKEN="pdfal2BEEDrT9bIpvWAyLPKB"

RUN echo "The ARG variable value is $VERCEL_ACCESS_TOKEN"

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and package-lock.json to the container
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install pnpm globally
RUN npm install -g pnpm
RUN npm install -g vercel

# Install app dependencies
RUN pnpm i --force

# Copy the rest of the application code to the container
COPY . /app

RUN pnpm prisma-generate

RUN cd frontend && pnpm i

# Expose port 3000 for the server to listen on
EXPOSE 3000

# Start the server using npm start
CMD ["pnpm", "vdev", "--token=$VERCEL_ACCESS_TOKEN"]