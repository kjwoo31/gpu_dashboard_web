# API Endpoints

This document outlines the available API endpoints for the GPU Control Hub.

- `GET /api/data`
  - Retrieves all data related to clusters, nodes, users, and policies.

- `POST /api/nodes/:nodeId/allocate`
  - Allocates a specific GPU node.

- `POST /api/nodes/:nodeId/release`
  - Releases a specific GPU node.

- `POST /api/nodes/:nodeId/restart`
  - Restarts a specific GPU node.

- `POST /api/nodes/:nodeId/toggle-expand`
  - Toggles the expand permission for a specific GPU node.

- `POST /api/nodes/expand`
  - Expands multiple GPU nodes.

- `POST /api/nodes/:nodeId/call-admin`
  - Sends a notification to the administrator for a specific GPU node.
