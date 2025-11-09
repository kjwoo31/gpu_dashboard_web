# Architecture Overview

## Project Overview

GPU Control Hub is a web application designed to monitor, allocate, expand, and manage GPU nodes across both Azure and on-premise environments. The system operates without external APIs, relying on YAML files for configuration and logging to track operations. For a detailed breakdown of the YAML files, see the [YAML Configuration](./yaml-configuration.md) documentation.

### Key Features

- **Real-Time Monitoring**: Track the status of each GPU in real time (e.g., Free, Used, Error).
- **Host-Specific GPU Selection**: Select and manage GPUs independently for each host machine.
- **GPU Allocation**: Allocate and release individual GPUs with per-GPU authentication. For more details, see the [Authentication](./authentication.md) documentation.
- **Multi-GPU Allocation**: Allocate multiple GPUs on the same host simultaneously.
- **Visual Grouping**: Visually group GPUs by owner or team.
- **Detailed Tooltips**: Hover over a GPU to view detailed information.
- **Expand Permissions**: Grant other users permission to expand GPU usage.
- **Responsive UI**: The application is designed to work on mobile, tablet, and desktop devices.
- **Accessibility**: ARIA labels are included to support screen readers.
- **Audit Logging**: All actions are logged for traceability.

## Core Components

The project is structured into several key directories:

- **/data**: Contains the YAML configuration files that act as the database.
- **/logs**: Stores log files for auditing and tracking commands.
- **/public**: Includes the frontend assets.
- **/src**: Contains the backend source code.

For more information about the API, see the [API Endpoints](./api-endpoints.md) documentation.

## Getting Started

To run the application locally, follow these steps:

### 1. Install Dependencies

```bash
npm install
```

### 2. Run the Server

```bash
npm start
```

For development, you can use `nodemon` to automatically restart the server on file changes:

```bash
npm run dev
```

### 3. Access the Application

Once the server is running, you can access the application in your browser at:

```
http://localhost:3000
```

## Testing

The project includes both unit and end-to-end tests.

### Unit Tests

To run the unit tests, use the following command:

```bash
npm test
```

### End-to-End Tests

To run the end-to-end tests, make sure the server is running and then execute:

```bash
npm run test:e2e
```

## Further Reading

- [YAML Configuration](./yaml-configuration.md)
- [API Endpoints](./api-endpoints.md)
- [Authentication](./authentication.md)
