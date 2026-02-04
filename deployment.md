# Deployment Guide

This guide outlines the steps to deploy the Binarykeeda backend services.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Building and Running with Docker Compose](#building-and-running-with-docker-compose)
4. [Nginx Configuration](#nginx-configuration)
5. [Troubleshooting](#troubleshooting)

## 1. Prerequisites
Before you begin, ensure you have the following installed:

*   **Git**: For cloning the repository.
*   **Docker**: For containerization.
*   **Docker Compose**: For orchestrating multi-container Docker applications.
*   **Node.js & npm/yarn** (Optional, for local development/testing of Node.js services outside Docker).
*   **Python & pip** (Optional, for local development/testing of Python services outside Docker).

## 2. Environment Setup

1.  **Clone the repository**:
    ```bash
    git clone <repository_url>
    cd Binarykeeda-backend-services
    ```

2.  **Environment Variables**:
    Create a `.env` file in the root directory of the project. This file will contain sensitive information and configuration specific to your deployment. An example `.env.production` is provided, you should adapt it.

    ```ini
    # Example .env content (adjust as per your needs)
    NODE_ENV=production
    PORT=3000
    MONGO_URI=mongodb://mongo:27017/binarykeeda
    REDIS_HOST=redis
    REDIS_PORT=6379
    JWT_SECRET=YOUR_VERY_SECRET_KEY
    DESCOPE_PROJECT_ID=YOUR_DESCOPE_PROJECT_ID
    # ... other environment variables for services (e.g., payment gateway, mailer credentials)
    ```

    *Make sure to fill in all necessary environment variables for your services.*

## 3. Building and Running with Docker Compose

The project uses `docker-compose.yml` to define and run the multi-container Docker application.

1.  **Build the Docker images**:
    ```bash
    docker-compose build
    ```
    This command will build the images for `api-core-node`, `evaluator-node`, `payment-node`, `ats-node`, and any other services defined in `docker-compose.yml`.

2.  **Start the services**:
    ```bash
    docker-compose up -d
    ```
    The `-d` flag runs the containers in detached mode (in the background).

3.  **Verify services are running**:
    ```bash
    docker-compose ps
    ```
    You should see all your services listed with `Up` status.

4.  **Stopping the services**:
    To stop and remove containers, networks, and volumes created by `up`:
    ```bash
    docker-compose down
    ```

## 4. Nginx Configuration

`nginx.conf` is provided to act as a reverse proxy and load balancer for your Node.js services. Ensure Nginx is properly configured to direct traffic to the correct Docker services.

If Nginx is running as a separate service (e.g., on the host or in its own Docker container not managed by the main `docker-compose.yml`):

1.  **Copy `nginx.conf`**: Place `nginx.conf` in your Nginx configuration directory (e.g., `/etc/nginx/sites-available/default` or `conf.d/binarykeeda.conf`).
2.  **Adjust DNS/IPs**: Ensure that the `proxy_pass` directives in `nginx.conf` correctly point to your Docker service names or their internal IP addresses/ports. Within `docker-compose`, service names resolve to their respective container IPs.

    Example snippet from `nginx.conf`:
    ```nginx
    # ...
    upstream api-core-node {
        server api-core-node:3000; # 'api-core-node' is the service name in docker-compose.yml
    }

    server {
        listen 80;
        server_name your_domain.com;

        location / {
            proxy_pass http://api-core-node;
            # ... other proxy settings
        }
    }
    # ...
    ```

## 5. Troubleshooting

*   **Check Docker logs**: If a service isn't starting, check its logs:
    ```bash
    docker-compose logs <service_name>
    ```
    (e.g., `docker-compose logs api-core-node`)

*   **Inspect container state**: 
    ```bash
    docker inspect <container_id_or_name>
    ```

*   **Port conflicts**: Ensure no other processes are using the ports required by your services (e.g., 80, 443, 3000).

*   **Environment variables**: Double-check that all necessary environment variables are set correctly in your `.env` file and are being picked up by the containers.

*   **Network issues**: Verify that Docker Compose has created the network correctly and containers can communicate with each other (e.g., `api-core-node` can reach `redis`).

For further assistance, refer to the individual service READMEs or contact the development team.
