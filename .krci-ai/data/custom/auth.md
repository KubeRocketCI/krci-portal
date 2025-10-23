# Authentication System

## Overview

The platform implements a comprehensive authentication system using Keycloak as the primary user management solution with OAuth/OIDC protocols.

## Architecture Components

### Backend Authentication Stack

- Keycloak: Primary user management and identity provider
- openid-client: Open-source package for OAuth provider connectivity
- OIDCClient: Custom wrapper around openid-client with simplified interface
- tRPC Procedures: Authenticated endpoints for auth and Kubernetes operations

### Frontend Authentication

- Login Page: Initiates the OAuth authorization flow
- Login Callback Page: Handles OAuth callback and token exchange
- Session Management: HTTP-only cookie-based session handling

## Authentication Flow

### 1. Login Initiation

- User navigates to the login page
- Frontend requests authentication URL from backend
- Backend generates authorization URL with callback redirect parameter

### 2. OAuth Authorization

- User is redirected to Keycloak authorization page
- User provides credentials and authorizes the application
- Keycloak redirects back to the callback URL with authorization code

### 3. Token Exchange & Session Creation

- Backend receives authorization code from callback
- Backend exchanges code for tokens (access, ID, refresh)
- Backend retrieves user data from Keycloak
- Backend creates session entry in database
- Backend returns authentication success with user data

### 4. Subsequent Requests

- All API requests include sessionId cookie
- Backend validates sessionId and retrieves session data from database
- Backend uses stored tokens for authenticated operations

## Security Features

- HTTP-only Cookies: Prevents XSS attacks on session tokens
- Session Database: Centralized session management with SQLite storage
- Token Refresh: Automatic token renewal using refresh tokens
- Secure Token Storage: Tokens stored server-side, not in browser

## Integration Points

- tRPC Authentication: All tRPC procedures protected by session validation
- Kubernetes Operations: ID tokens used for cluster communication
- Permission Checking: Role-based access control through Keycloak groups
