# YAML Configuration Files

The GPU Control Hub uses YAML files to store its data. This document provides an overview of the different configuration files.

## `clusters.yaml`

Defines the GPU clusters.

```yaml
clusters:
  - id: "azure"
    name: "Azure GPU Cluster"
    location: "Azure"
    notebook_url_template: "https://jupyter.azure.example/{node_id}"
    grafana_url: "https://grafana.azure.example/d/GPUNodes"
```

## `nodes.yaml`

Contains information about each individual GPU node.

```yaml
nodes:
  - node_id: "az-01-gpu-0"
    host_id: "az-01"
    gpu_index: 0
    cluster_id: "azure"
    gpu_model: "A100"
    gpu_mem_gb: 80
    status: "Free"
    owner: null
    team: null
    password_hash: null
    allow_expand: false
    last_error: null
    bmc_ip: "10.0.1.11"
```

## `users.yaml`

Stores user information and permissions. **Note:** This file is currently for reference only and is not used for authentication.

```yaml
users:
  - id: "alice"
    name: "Alice Kim"
    role: "user"
    password_hash: "$2b$12$..."
    contact: "alice@example.com"
```

## `policies.yaml`

Manages UI settings, policies, and logging configurations.
