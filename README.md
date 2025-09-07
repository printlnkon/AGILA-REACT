# AGILA

## Tech Stack

- **Frontend**: React.js, Tailwind CSS
- **Animation**: AOS (Animate On Scroll)
- **Icons**: Lucide Icons
- **Routing**: React Router
- **Containerization**: Docker

## Getting Started

### Prerequisites

- Node.js (v14 or higher) - _only needed for local development_
- npm - _only needed for local development_
- Docker Desktop - _for containerized development and deployment_

### Installation Options

#### Option 1: Local Development

1. Clone the repository

   ```bash
   git clone https://github.com/printlnkon/AGILA-REACT.git
   cd AGILA-REACT
   ```

2. Install dependencies

   ```bash
   cd web
   npm install
   ```

3. Start the development server

   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

#### Option 2: Docker Development (Recommended)

1. Install Docker Desktop
   - For Windows: [Download Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)
   - For Mac: [Download Docker Desktop for Mac](https://www.docker.com/products/docker-desktop)
   - For Linux: Follow the [Docker Engine installation guide](https://docs.docker.com/engine/install/)

2. Clone the repository
   ```bash
   git clone https://github.com/printlnkon/AGILA-REACT.git
   cd AGILA-REACT
   ```

3. Create a `.env` file in the `web` directory with your Firebase configuration
   ```bash
   cd web
   touch .env
   ```

   Add your Firebase variables to the `.env` file:
   ```
   VITE_API_KEY="your_api_key"
   VITE_AUTH_DOMAIN="your_auth_domain"
   VITE_DATABASE_URL="your_database_url"
   VITE_PROJECT_ID="your_project_id"
   VITE_STORAGE_BUCKET="your_storage_bucket"
   VITE_MESSAGING_SENDER_ID="your_sender_id"
   VITE_APP_ID="your_app_id"
   VITE_MEASUREMENT_ID="your_measurement_id"
   ```

4. Build and start the Docker container
   ```bash
   docker-compose up --build
   ```

5. Open your browser and navigate to `http://localhost:5173`

### Docker Commands

- Build the Docker image:
  ```bash
  docker build -t agila-docker .
  ```

- Run the container:
  ```bash
  docker run -p 5173:8080 agila-docker
  ```

- Stop and remove all containers:
  ```bash
  docker-compose down
  ```

- View running containers:
  ```bash
  docker ps
  ```

## License

This project is licensed under the MIT License - see the LICENSE file for details.