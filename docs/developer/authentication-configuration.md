# Authentication Configuration

## Overview

CCP4i2 supports two authentication modes:

- **MSAL Authentication Required**: Azure AD login required before accessing the app
- **No Authentication**: Direct access without login (suitable for desktop Electron app)

This is controlled by the `NEXT_PUBLIC_REQUIRE_AUTH` environment variable.

## Build-Time Configuration

### Setting the Environment Variable

#### Electron Desktop App (No Authentication)

Set in `client/main/ccp4i2-django-server.ts`:

```typescript
const pythonEnv = {
  // ...
  NEXT_PUBLIC_REQUIRE_AUTH: "false", // No auth for desktop
  // ...
};
```

#### Web Deployment (MSAL Authentication Required)

Set in your deployment environment:

**Azure Web App**:

```bash
az webapp config appsettings set \
  --resource-group <resource-group> \
  --name <app-name> \
  --settings NEXT_PUBLIC_REQUIRE_AUTH=true
```

**Docker**:

```yaml
# docker-compose.yml
services:
  web:
    environment:
      - NEXT_PUBLIC_REQUIRE_AUTH=true
```

**Local Development**:

```bash
# .env.local (in client/renderer/)
NEXT_PUBLIC_REQUIRE_AUTH=true
```

## How It Works

### Code Implementation

In `client/renderer/app/layout.tsx`:

```tsx
const REQUIRE_AUTH = process.env.NEXT_PUBLIC_REQUIRE_AUTH === "true";

export default function RootLayout(props: PropsWithChildren) {
  return (
    <html lang="en">
      <body>
        {REQUIRE_AUTH ? (
          <AuthProvider>
            <ThemeProvider theme={theme}>
              <DeleteDialogProvider>
                <RequireAuth>
                  <CCP4i2App>{props.children}</CCP4i2App>
                </RequireAuth>
              </DeleteDialogProvider>
            </ThemeProvider>
          </AuthProvider>
        ) : (
          <ThemeProvider theme={theme}>
            <DeleteDialogProvider>
              <CCP4i2App>{props.children}</CCP4i2App>
            </DeleteDialogProvider>
          </ThemeProvider>
        )}
      </body>
    </html>
  );
}
```

### Component Tree

**With Authentication** (`NEXT_PUBLIC_REQUIRE_AUTH=true`):

```
AuthProvider (MSAL context)
  └─ ThemeProvider
      └─ DeleteDialogProvider
          └─ RequireAuth (enforces login)
              └─ CCP4i2App
                  └─ children
```

**Without Authentication** (`NEXT_PUBLIC_REQUIRE_AUTH=false`):

```
ThemeProvider
  └─ DeleteDialogProvider
      └─ CCP4i2App
          └─ children
```

## Configuration per Deployment Type

| Deployment Type      | NEXT_PUBLIC_REQUIRE_AUTH | Where to Set                                        |
| -------------------- | ------------------------ | --------------------------------------------------- |
| Electron Desktop     | `false`                  | `client/main/ccp4i2-django-server.ts`               |
| Azure Web App        | `true`                   | Azure Portal → Configuration → Application Settings |
| Docker (Web)         | `true`                   | `Docker/docker-compose.yml` environment section     |
| Local Dev (Web)      | `true`                   | `client/renderer/.env.local`                        |
| Local Dev (Electron) | `false`                  | Already set in `ccp4i2-django-server.ts`            |

## Verification

### Check Current Setting

```bash
# In the browser console (web deployment)
console.log(process.env.NEXT_PUBLIC_REQUIRE_AUTH);

# In Electron (will be inherited from main process)
# Check the main process logs for "Starting Python Django server with environment:"
```

### Test Authentication Mode

**With Auth Enabled**:

1. Launch app
2. Should redirect to Microsoft login page
3. After login, access main interface

**With Auth Disabled**:

1. Launch app
2. Direct access to main interface
3. No login prompt

## Troubleshooting

### Auth Not Working in Web Deployment

- Verify `NEXT_PUBLIC_REQUIRE_AUTH=true` is set in Azure App Service Configuration
- Check that MSAL configuration (client ID, tenant ID) is properly set
- Ensure `client/renderer/components/auth-provider.tsx` is configured correctly

### Auth Showing in Electron Desktop

- Verify `NEXT_PUBLIC_REQUIRE_AUTH: "false"` in `ccp4i2-django-server.ts`
- Rebuild Electron app: `npm run build` in client directory
- Check Electron main process logs for environment variables

### Environment Variable Not Taking Effect

- **Next.js rule**: Environment variables prefixed with `NEXT_PUBLIC_` are embedded at **build time**
- Changes require rebuilding the app
- For Electron: `npm run build`
- For web: `npm run build` or restart dev server

## Security Considerations

### Desktop (Electron) - No Auth

- **Rationale**: Desktop app runs locally, user already has physical access to machine
- **Security**: Relies on OS-level user authentication
- **Use Case**: Single-user desktop installation

### Web Deployment - MSAL Auth

- **Rationale**: Multi-user web access requires identity management
- **Security**: Azure AD integration, token-based authentication
- **Use Case**: Team collaboration, cloud deployment

## Related Components

- `client/renderer/components/auth-provider.tsx`: MSAL authentication provider
- `client/renderer/components/require-auth.tsx`: Authentication guard component
- `client/main/ccp4i2-django-server.ts`: Electron environment configuration
- `docs/developer/environment-configuration.md`: General environment setup guide
