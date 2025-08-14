# Task validation

By default, task validation occurs on the server using the built in `CCP4i2` validation of of the task. Parameters controlling this validation are defined in the task's `.def.xml` file. A view of the prevailing validation report can be seen by engaging `developer mode` and looking at the relevant tab in the job view.

![Prevailing validation report](../../../images/validation-report.png)

`ccp4i2-django` provides a mechanism to override this default validation to 1) remove validation issues based on the current state of the interface, 2) identify additional validation issues based on the current state of the interface, or 3) add additional user elements to the run-confirmation dialog.

## 1. Removing validation issues to enable running

An example: The default validation of an `aimless_pipe` plugin considers there to be an error if the elements of the parameter `aimless_pipe.controlParameters.CELL` are not set. This behaviour reflects a limitation in the `.def.xml`-based validation in expressing requirements that may not apply depending on other parameters of the task. This issue has an associated `maxSeverity` of 2, which would normally inhibit task execution. To intercept and nullify the issue, the task processes the prevailing error
report and pushes the processedErrors into a context layer that handles job submission

Firstly additional imports

```tsx
// Imports
import { useRunCheck } from "../../../providers/run-check-provider";
```

Then code within the functional component definition:

```tsx
//1. Retrieve the jobs validation: this will be kept up to date automatically as parameters
//change
const { validation } = useJob(job.id);

// 2. Retrieve the function for setting a processed Error Report

const { processedErrors, setProcessedErrors } = useRunCheck();

// 3. Provide a useEffect which will filter out the errors related to the cell parameters
// of the aimless_pipe task, and set the `processedErrors` context variable

useEffect(() => {
  if (!validation) return;
  const newProcessedErrors = Object.keys(validation)
    .filter((key) => !key.startsWith("aimless_pipe.controlParameters.CELL."))
    .reduce((acc, key) => {
      acc[key] = validation[key];
      return acc;
    }, {} as any);
  // Important: only update if processedErrors have changed
  if (JSON.stringify(newProcessedErrors) !== JSON.stringify(processedErrors)) {
    setProcessedErrors(newProcessedErrors);
  }
}, [validation, processedErrors, setProcessedErrors]);
```

## 2. Identifying additional validation issues

An example: prosmart_refmac generates an error with maxSeverity 1 (i.e. WARNING) if the FREERFLAG task element is not set. It may not, however, be desirable not to simply "wave" the task interface through without Free R set. To override this default behaviour, an additional report can be added to the default validation, with the maxSeverity level 3, which causes a confirmation dialog to be shown, allowing the user to proceed as is if they choose.

Firstly additional imports

```tsx
// Imports
import { useContext } from "react";
import {
  RunCheckContext,
  useRunCheck,
} from "../../../providers/run-check-provider";
```

Then code within the functional component definition:

```tsx
// 1. Retrieve the jobs validation: this will be kept up to date automatically as parameters
//change.  Also retrieve getTaskItem function
const { validation } = useJob(job.id);

// 2. get the prevailing value of FREERFLAG: this will be updated on each re-render

const { value: freeRFlag } = getTaskItem("FREERFLAG");

// 3. Retrieve the function for setting a processed Error Report

const { processedErrors, setProcessedErrors } = useRunCheck();

// 4. Provide a useEffect which will add a new error report with maxSeverity 3 if the FREERFLAG is not set

useEffect(() => {
  if (!validation) return;
  const newProcessedErrors = { ...validation };

  if (!(freeRFlag?.dbFileId?.length > 0)) {
    // If the Free R flag is not set, we add an overridable serious error report.
    if (processedErrors?.FREERFLAG) return;
    newProcessedErrors.FREERFLAG = {
      messages: [
        "Setting the Free R flag file is strongly recommended for refinement",
        "You are advised to select an existing set or create a new one ",
      ],
      maxSeverity: 3, //maxSeverity of 2 causes the confirm dialog to show, and prevents execution
      // maxSeverity of 3 causes confirm dialog to show, but allows execution
    };
  }

  // Only update if processedErrors have changed
  if (JSON.stringify(newProcessedErrors) !== JSON.stringify(processedErrors)) {
    setProcessedErrors(newProcessedErrors);
  }
}, [
  validation,
  freeRFlag,
  refinementMode,
  processedErrors,
  setProcessedErrors,
]);
```
