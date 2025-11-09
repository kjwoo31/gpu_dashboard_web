# Authentication

The GPU Control Hub uses a per-GPU authentication system. This document explains how authentication works.

## Overview

Instead of a centralized user account system, the application stores authentication details on each individual GPU. When a user allocates a GPU, they provide a User ID, Password, and Team, which are then saved to that specific GPU. To release or manage the GPU, the user must provide the exact same credentials.

## Allocation

When allocating a GPU, the user is prompted to enter a User ID, Password, and Team. This information is stored on the GPU and is required for any future actions.

## Releasing and Managing

To release or manage a GPU, the user must provide the same User ID and Password that were used to allocate it. If the credentials do not match, the action will be denied.

## Security

**Important:** Passwords are currently stored in plaintext. For a production environment, it is highly recommended to use a hashing library like `bcrypt` to secure passwords.
