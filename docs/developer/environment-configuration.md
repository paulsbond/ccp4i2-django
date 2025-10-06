# Environment Configuration Guide

This guide explains where and how to set environment variables for different deployment scenarios.

## 📋 Overview

The application uses environment variables to configure execution mode:

- **`EXECUTION_MODE=local`**: Jobs run via subprocess (Electron app, local development)
- **`EXECUTION_MODE=azure`**: Jobs queued via Azure Service Bus (cloud deployment)

## 🖥️ Electron Application (Desktop App)

### Where to Set

Environment variables for the Electron app are set in the **main process** before starting the Django server.

**File**: `client/main/ccp4i2-django-server.ts`

```typescript
// Set environment variables BEFORE any Python operations
const pythonEnv = {
  ...process.env,
  UVICORN_PORT: `${UVICORN_PORT}`,
  NEXT_ADDRESS: `http://localhost:${NEXT_PORT}`,
  // Force local execution mode for Electron app
  EXECUTION_MODE: "local",
  MPLBACKEND: "Agg",
  // ... other environment variables
};
```

### Why Here?

1. ✅ **Set before Django server starts** - Environment is ready when API starts
2. ✅ **Inherited by subprocess** - Django process gets these variables
3. ✅ **Consistent across platforms** - Works on macOS, Windows, Linux
4. ✅ **No user configuration needed** - Automatic for all Electron users

### Development vs Production

**Development Mode** (`isDev = true`):

```typescript
if (isDev) {
  pythonEnv.DEBUG = "True";
  pythonEnv.EXECUTION_MODE = "local";
}
```

**Production Build** (packaged app):

```typescript
// Already set to "local" in pythonEnv
// No changes needed - works automatically
```

## 🌐 Web Development (Without Electron)

When running Django directly without Electron:

### Option 1: Shell Environment

```bash
# In your terminal before starting Django
export EXECUTION_MODE=local
export CCP4=/Applications/ccp4-9
python manage.py runserver
```

### Option 2: .env File

Create `server/.env`:

```bash
EXECUTION_MODE=local
CCP4=/Applications/ccp4-9
DEBUG=True
```

Install `python-dotenv`:

```bash
pip install python-dotenv
```

Load in `server/ccp4x/config/settings.py`:

```python
from pathlib import Path
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Now environment variables are available
EXECUTION_MODE = os.getenv("EXECUTION_MODE", "local")
```

### Option 3: IDE Configuration

**VS Code** - `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Django Server",
      "type": "python",
      "request": "launch",
      "program": "${workspaceFolder}/server/manage.py",
      "args": ["runserver"],
      "env": {
        "EXECUTION_MODE": "local",
        "CCP4": "/Applications/ccp4-9",
        "DEBUG": "True"
      }
    }
  ]
}
```

**PyCharm** - Run Configuration:

1. Edit Run Configuration
2. Environment Variables section
3. Add: `EXECUTION_MODE=local;CCP4=/Applications/ccp4-9`

## ☁️ Azure Container Apps (Cloud Deployment)

### Azure Portal

1. Go to your Container App
2. Navigate to **Settings** → **Environment variables**
3. Add:

   ```
   Name: EXECUTION_MODE
   Value: azure

   Name: SERVICE_BUS_CONNECTION_STRING
   Value: Endpoint=sb://your-namespace.servicebus.windows.net/;...

   Name: SERVICE_BUS_QUEUE_NAME
   Value: job-queue
   ```

### Azure CLI

```bash
az containerapp update \
  --name ccp4i2-server \
  --resource-group your-resource-group \
  --set-env-vars \
    "EXECUTION_MODE=azure" \
    "SERVICE_BUS_CONNECTION_STRING=secretref:servicebus-connection" \
    "SERVICE_BUS_QUEUE_NAME=job-queue"
```

### Bicep Template

```bicep
resource containerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'ccp4i2-server'
  properties: {
    configuration: {
      secrets: [
        {
          name: 'servicebus-connection'
          value: serviceBusConnectionString
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'server'
          env: [
            {
              name: 'EXECUTION_MODE'
              value: 'azure'
            }
            {
              name: 'SERVICE_BUS_CONNECTION_STRING'
              secretRef: 'servicebus-connection'
            }
            {
              name: 'SERVICE_BUS_QUEUE_NAME'
              value: 'job-queue'
            }
          ]
        }
      ]
    }
  }
}
```

### Azure Key Vault (Best Practice)

Store sensitive values in Key Vault:

```bash
# Store connection string in Key Vault
az keyvault secret set \
  --vault-name your-keyvault \
  --name servicebus-connection \
  --value "Endpoint=sb://..."

# Reference in Container App
az containerapp update \
  --name ccp4i2-server \
  --resource-group your-resource-group \
  --set-env-vars \
    "EXECUTION_MODE=azure" \
  --secrets \
    "servicebus-connection=keyvaultref:https://your-keyvault.vault.azure.net/secrets/servicebus-connection,identityref:/subscriptions/.../managedIdentities/..."
```

## 🐳 Docker / Docker Compose

### docker-compose.yml

```yaml
services:
  server:
    image: ccp4i2-server:latest
    environment:
      - EXECUTION_MODE=local # or azure
      - CCP4=/usr/local/ccp4
      - SERVICE_BUS_CONNECTION_STRING=${SERVICE_BUS_CONNECTION_STRING}
    env_file:
      - .env # Load additional variables from file
```

### .env file

```bash
EXECUTION_MODE=local
CCP4=/usr/local/ccp4
DEBUG=False
DJANGO_SECRET_KEY=your-secret-key
```

### Dockerfile

```dockerfile
# Set default environment variables
ENV EXECUTION_MODE=local
ENV CCP4=/usr/local/ccp4

# Can be overridden at runtime
```

## 🧪 Testing

### Pytest

```python
# tests/conftest.py
import pytest
import os

@pytest.fixture(autouse=True)
def set_test_environment():
    os.environ["EXECUTION_MODE"] = "local"
    os.environ["CCP4"] = "/tmp/ccp4-test"
    yield
    # Cleanup if needed
```

### Django Test Runner

```python
# server/ccp4x/config/settings_test.py
import os

os.environ["EXECUTION_MODE"] = "local"
os.environ["CCP4"] = "/tmp/ccp4-test"

# Import base settings
from .settings import *

# Test-specific overrides
DEBUG = True
```

## 🔍 Verification

### Check Current Mode

Add a diagnostic endpoint to verify configuration:

```python
# server/ccp4x/api/views.py
from django.http import JsonResponse
from ccp4x.lib.context_dependent_run import get_execution_mode

def diagnostic(request):
    return JsonResponse({
        "execution_mode": get_execution_mode(),
        "ccp4_installed": os.getenv("CCP4") is not None,
        "service_bus_configured": os.getenv("SERVICE_BUS_CONNECTION_STRING") is not None,
    })
```

### Logs

Check server logs for mode detection:

```
Using explicit execution mode: local
Executing job 123 (uuid=...) in LOCAL mode
```

or

```
Detected Azure Service Bus config, using azure mode
Executing job 123 (uuid=...) in AZURE mode
```

## 📊 Summary Table

| Scenario         | Where to Set              | Method                  | Priority |
| ---------------- | ------------------------- | ----------------------- | -------- |
| **Electron App** | `ccp4i2-django-server.ts` | Hardcode in `pythonEnv` | ⭐⭐⭐   |
| **Web Dev**      | Terminal / .env           | Shell export or dotenv  | ⭐⭐⭐   |
| **Azure Cloud**  | Azure Portal / CLI        | Environment variables   | ⭐⭐⭐   |
| **Docker**       | docker-compose.yml        | YAML config             | ⭐⭐     |
| **Testing**      | pytest fixtures           | Code-based              | ⭐⭐     |

## 🎯 Best Practices

1. ✅ **Never commit secrets** to git (use .gitignore for .env files)
2. ✅ **Use explicit EXECUTION_MODE** for clarity
3. ✅ **Set before starting services** (not dynamically)
4. ✅ **Document in README** for team members
5. ✅ **Use Key Vault** for production secrets
6. ✅ **Test both modes** regularly

## 🚨 Common Issues

### "CCP4 environment variable not set"

**Solution**: Set `CCP4` path in environment before starting Django

### "Service Bus configuration missing"

**Solution**: Set `SERVICE_BUS_CONNECTION_STRING` or change `EXECUTION_MODE` to `local`

### Environment variable not taking effect

**Solution**: Restart Django server after changing environment variables

---

**Last Updated**: October 2025  
**Maintainers**: CCP4i2 Development Team
