# Deployment Guide

This guide covers how to build and deploy ccp4i2-django as both an Electron desktop application and a standalone web application.

## Overview

The ccp4i2-django client can be deployed in two ways:

1. **Electron Desktop Application** - Cross-platform desktop app with integrated Django server
2. **Standalone Web Application** - Browser-based app that connects to a separate Django API server

Both deployment targets share the same React/Next.js codebase but are optimized for their respective platforms.

## Prerequisites

- Node.js 18 or later
- npm
- A running Django API server (for web deployment)

## Development Setup

### Environment Configuration

The build system uses environment variables to determine the target platform:

- **Electron**: `BUILD_TARGET=electron`
- **Web**: `BUILD_TARGET=web`

### Platform Detection

The application automatically detects its runtime environment using the platform utility:

```typescript
// renderer/utils/platform.ts
export const isElectron = (): boolean => {
  // Returns true if running in Electron, false if in browser
};

export const getApiBaseUrl = (): string => {
  // Returns appropriate API endpoint based on platform
};
```

## Electron Desktop Application

### Development

Start the Electron app in development mode:

```bash
cd client
npm run start:electron
```

This will:

1. Copy required assets (Moorhen, RDKit, etc.)
2. Build the Electron main and preload processes
3. Start the Next.js renderer in Electron mode
4. Launch the Electron application

### Building

Build the Electron application for distribution:

```bash
cd client
npm run build:electron
```

### Packaging

Package the application for different platforms:

```bash
# macOS
npm run package-mac

# Windows
npm run package-win

# Linux (x64)
npm run package-linux-x64

# Linux (ARM64)
npm run package-linux-arm64

# Linux (both architectures)
npm run package-linux-all
```

Built packages will be available in the `dist/` directory.

### Distribution

The packaged applications include:

- Embedded Django server
- Complete project database
- All required scientific libraries (Moorhen, RDKit)
- Platform-specific installers

## Web Application

### Development

Start the web application in development mode:

```bash
cd client
npm run start:web
```

This starts a Next.js development server at `http://localhost:3000` that connects to your Django API server.

### Environment Variables

For web deployment, configure these environment variables:

```bash
# .env.web or environment-specific configuration
BUILD_TARGET=web
NEXT_PUBLIC_IS_ELECTRON=false
NEXT_PUBLIC_API_BASE_URL=https://your-api-server.com
```

### Building

#### Static Export (Recommended for CDN/Static Hosting)

```bash
cd client
npm run export:web
```

This creates a static export in `renderer/out/` that can be deployed to:

- GitHub Pages
- Netlify
- Vercel
- AWS S3 + CloudFront
- Any static file hosting service

#### Server-Side Rendering Build

```bash
cd client
npm run build:web
```

This creates a Next.js build in `renderer/.next/` for server deployment.

### Deployment Options

#### 1. Static Hosting

Deploy the exported static files:

```bash
# After running npm run export:web
# Upload the contents of renderer/out/ to your hosting service
```

#### 2. Node.js Server

Deploy with a Node.js server:

```bash
# After running npm run build:web
# Deploy renderer/.next/ and package.json
# Start with: npm run start:web
```

#### 3. Docker Deployment

Use the provided Dockerfile for containerized deployment:

```bash
# Build the Docker image
docker build -f Docker/Dockerfile.web -t ccp4i2-web .

# Run the container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_BASE_URL=https://your-api-server.com \
  ccp4i2-web
```

#### 4. Kubernetes Deployment

Example Kubernetes deployment configuration:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ccp4i2-web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ccp4i2-web
  template:
    metadata:
      labels:
        app: ccp4i2-web
    spec:
      containers:
        - name: ccp4i2-web
          image: ccp4i2-web:latest
          ports:
            - containerPort: 3000
          env:
            - name: NEXT_PUBLIC_API_BASE_URL
              value: "https://your-api-server.com"
---
apiVersion: v1
kind: Service
metadata:
  name: ccp4i2-web-service
spec:
  selector:
    app: ccp4i2-web
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: LoadBalancer
```

## Configuration Differences

### API Endpoints

- **Electron**: Uses `/api/proxy/` (proxied to embedded Django server)
- **Web**: Uses `NEXT_PUBLIC_API_BASE_URL` environment variable

### Asset Handling

- **Electron**: Assets bundled with application
- **Web**: Assets served from CDN or static hosting

### Authentication

- **Electron**: No authentication required (single-user desktop app)
- **Web**: May require authentication depending on Django API configuration

## Troubleshooting

### Common Issues

1. **Build Failures**

   - Ensure all dependencies are installed: `npm ci`
   - Check Node.js version compatibility
   - Verify environment variables are set correctly

2. **API Connection Issues**

   - Verify `NEXT_PUBLIC_API_BASE_URL` is correct for web builds
   - Check CORS configuration on Django server for web deployment
   - Ensure Django server is running and accessible

3. **Asset Loading Issues**

   - Run `npm run copy-assets` manually if assets are missing
   - Check that Moorhen and RDKit dependencies are properly installed

4. **Platform Detection Issues**
   - Verify environment variables are set correctly
   - Check that `renderer/utils/platform.ts` is properly imported

### Debugging

Enable verbose logging:

```bash
# For Electron
DEBUG=* npm run start:electron

# For web development
npm run start:web -- --debug
```

## Performance Considerations

### Electron

- Application size: ~200-500MB (includes all dependencies)
- Startup time: 2-5 seconds
- Memory usage: 100-300MB base + project data

### Web

- Initial load: Depends on hosting and caching
- Bundle size: ~10-20MB (optimized)
- Runtime memory: 50-150MB in browser

## Security Considerations

### Electron

- Code signing recommended for distribution
- Auto-updater should use HTTPS
- Sensitive operations isolated in main process

### Web

- HTTPS required for production
- Proper CORS configuration needed
- API authentication/authorization required
- Content Security Policy recommended

## Monitoring and Analytics

### Electron

- Application crash reporting
- Usage analytics (with user consent)
- Performance monitoring

### Web

- Standard web analytics
- Error tracking (Sentry, etc.)
- Performance monitoring (Web Vitals)

## Support

For deployment issues:

1. Check this documentation
2. Review build logs for errors
3. Consult the project's GitHub issues
4. Contact the development team

## Version Compatibility

- Node.js: 18.x or later
- Electron: 34.x
- Next.js: Latest
- React: 19.x

Ensure all dependencies are compatible before deployment.
