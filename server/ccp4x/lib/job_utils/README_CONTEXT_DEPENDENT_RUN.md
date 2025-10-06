# Context-Dependent Job Execution

This module provides environment-aware job execution that automatically adapts to your deployment context.

## 🎯 Purpose

Allows the **same codebase** to work in different environments:

- **Local Development**: Runs jobs via subprocess on your laptop
- **Azure Deployment**: Queues jobs via Service Bus for container workers

No code changes needed - just set environment variables!

## 🔧 Configuration

### Local Development (Laptop/Desktop)

```bash
# Option 1: Explicit local mode
export EXECUTION_MODE=local
export CCP4=/Applications/ccp4-9

# Option 2: Implicit (just set CCP4, no Azure vars)
export CCP4=/Applications/ccp4-9
```

### Azure Container Apps

```bash
# Option 1: Explicit azure mode
EXECUTION_MODE=azure
SERVICE_BUS_CONNECTION_STRING=Endpoint=sb://your-namespace.servicebus.windows.net/;SharedAccessKeyName=...
SERVICE_BUS_QUEUE_NAME=job-queue

# Option 2: Implicit (presence of SERVICE_BUS_CONNECTION_STRING auto-detects azure)
SERVICE_BUS_CONNECTION_STRING=Endpoint=sb://your-namespace.servicebus.windows.net/;SharedAccessKeyName=...
```

## 📋 Environment Variables

| Variable                        | Required    | Default     | Description                       |
| ------------------------------- | ----------- | ----------- | --------------------------------- |
| `EXECUTION_MODE`                | No          | auto-detect | Explicit mode: 'local' or 'azure' |
| `CCP4`                          | Yes (local) | -           | Path to CCP4 installation         |
| `SERVICE_BUS_CONNECTION_STRING` | Yes (azure) | -           | Azure Service Bus connection      |
| `SERVICE_BUS_QUEUE_NAME`        | No          | 'job-queue' | Azure queue name                  |

## 🚀 Usage

### In Your API Code

```python
from ccp4x.lib.context_dependent_run import run_job_context_aware

def run(self, request, pk=None):
    job = models.Job.objects.get(id=pk)

    # Automatically uses correct backend based on environment
    result = run_job_context_aware(job)

    if result["success"]:
        return Response(JobSerializer(result["data"]).data)
    else:
        return Response(
            {"error": result["error"]},
            status=result["status"]
        )
```

That's it! No `if/else` for deployment context, no Azure imports in your ViewSet.

## 🏗️ Architecture

### Detection Logic

```
1. Check EXECUTION_MODE env var (explicit)
   ├─ "local" → Use subprocess
   └─ "azure" → Use Service Bus

2. Check for SERVICE_BUS_CONNECTION_STRING (implicit)
   ├─ Present → Use Azure (Service Bus)
   └─ Absent → Use local (subprocess)

3. Default to local mode
```

### Local Mode Flow

```
API receives POST /api/jobs/{id}/run/
  ↓
run_job_context_aware(job)
  ↓
run_job_local(job)
  ↓
subprocess.Popen([ccp4-python, manage.py, run_job, -ju, {uuid}])
  ↓
Job starts immediately
```

### Azure Mode Flow

```
API receives POST /api/jobs/{id}/run/
  ↓
run_job_context_aware(job)
  ↓
run_job_azure(job)
  ↓
ServiceBusClient.send_message({job_data})
  ↓
Job status → QUEUED
  ↓
Worker container picks up message
  ↓
Worker executes job
```

## 📦 Dependencies

### Local Mode

- Standard library only (subprocess, pathlib, os)
- No Azure libraries needed

### Azure Mode

- `azure-servicebus>=7.8.0`
- `azure-identity>=1.12.0`

**Note**: Azure libraries are lazy-loaded only when needed, so local deployments stay lightweight.

## 🧪 Testing

### Test Local Mode

```bash
# Set environment
export EXECUTION_MODE=local
export CCP4=/Applications/ccp4-9

# Run Django server
python manage.py runserver

# POST to job run endpoint - should start subprocess
```

### Test Azure Mode

```bash
# Set environment
export EXECUTION_MODE=azure
export SERVICE_BUS_CONNECTION_STRING="Endpoint=..."

# Run Django server
python manage.py runserver

# POST to job run endpoint - should queue to Service Bus
```

### Verify Mode in Logs

Look for log messages:

```
Using explicit execution mode: local
Executing job 123 (uuid=...) in LOCAL mode
Started job 123 (...) via subprocess
```

or

```
Detected Azure Service Bus config, using azure mode
Executing job 123 (uuid=...) in AZURE mode
Queued job 123 (...) via Azure Service Bus
```

## 🎨 Benefits

✅ **Single Codebase**

- No branch divergence between local and cloud
- Merge updates once, works everywhere

✅ **Clean Code**

- API endpoints stay simple and focused
- No Azure imports polluting local development

✅ **Easy Testing**

- Test both modes by changing env vars
- No code changes required

✅ **Production Ready**

- Proper error handling for both modes
- Comprehensive logging
- Battle-tested patterns

## 🔍 Troubleshooting

### "Azure libraries not installed" Error

**Problem**: Running in Azure mode without Azure packages installed

**Solution**:

```bash
pip install azure-servicebus azure-identity
```

### "CCP4 environment variable not set" Error

**Problem**: Running in local mode without CCP4 configured

**Solution**:

```bash
export CCP4=/path/to/ccp4-installation
```

### Jobs Not Starting

**Check**:

1. Review logs for execution mode detection
2. Verify environment variables are set correctly
3. For Azure: Check Service Bus connection string
4. For Local: Check CCP4 path and permissions

## 📚 Related Files

- `/server/ccp4x/lib/context_dependent_run.py` - Main implementation
- `/server/ccp4x/api/JobViewSet.py` - API endpoint using this module
- `/server/worker.py` - Azure worker consuming queued jobs
- `/server/requirements.txt` - Core dependencies
- `/server/requirements-azure.txt` - Azure-specific dependencies

## 🎓 Design Patterns Used

- **Strategy Pattern**: Swaps execution backend at runtime
- **Lazy Loading**: Imports Azure libraries only when needed
- **Environment-Based Configuration**: 12-factor app principles
- **Dependency Injection**: Clean separation of concerns

---

**Maintainers**: CCP4i2 Development Team  
**Last Updated**: October 2025
