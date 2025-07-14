# CCP4i2ValidationDisplay

## Overview

`CCP4i2ValidationDisplay` is a React component that provides visual feedback for parameter validation within CCP4i2 task interfaces. It displays validation messages, warnings, and errors in a user-friendly format.

## Usage

```tsx
import { CCP4i2ValidationDisplay } from "../task-elements/validation";

<CCP4i2ValidationDisplay
  validation={validationResult}
  severity="error"
  showIcon={true}
  collapsible={true}
/>
```

## Props

### Required Props

- **`validation`** (`object`): Validation result object containing messages and severity levels

### Optional Props

- **`severity`** (`string`): Override severity level ("info", "warning", "error", "success")
- **`showIcon`** (`boolean`): Whether to display severity icons (default: true)
- **`collapsible`** (`boolean`): Whether validation messages can be collapsed (default: false)
- **`maxHeight`** (`number`): Maximum height for scrollable content
- **`onDismiss`** (`function`): Callback for dismissible validation messages

## Validation Object Structure

```typescript
interface ValidationResult {
  isValid: boolean;
  severity: 'info' | 'warning' | 'error' | 'success';
  messages: string[];
  details?: {
    parameter: string;
    value: any;
    constraint: string;
    suggestion?: string;
  }[];
}
```

## Examples

### Basic Error Display

```tsx
const validationError = {
  isValid: false,
  severity: 'error',
  messages: [
    'Input file does not exist',
    'File format is not supported'
  ]
};

<CCP4i2ValidationDisplay
  validation={validationError}
  showIcon={true}
/>
```

### Warning with Details

```tsx
const validationWarning = {
  isValid: true,
  severity: 'warning',
  messages: ['File is very large and may take time to process'],
  details: [{
    parameter: 'HKLIN',
    value: '/path/to/large_file.mtz',
    constraint: 'file_size < 1GB',
    suggestion: 'Consider using a smaller dataset for testing'
  }]
};

<CCP4i2ValidationDisplay
  validation={validationWarning}
  collapsible={true}
  onDismiss={() => dismissWarning('file_size')}
/>
```

### Success Confirmation

```tsx
const validationSuccess = {
  isValid: true,
  severity: 'success',
  messages: ['All parameters validated successfully']
};

<CCP4i2ValidationDisplay
  validation={validationSuccess}
  showIcon={true}
/>
```

### Collapsible Multi-Message Display

```tsx
const complexValidation = {
  isValid: false,
  severity: 'error',
  messages: [
    'Multiple validation errors found:',
    '• Missing required parameter: CYCLES',
    '• Invalid file path: /nonexistent/file.pdb',
    '• Value out of range: WEIGHT must be between 0.1 and 10.0'
  ],
  details: [
    {
      parameter: 'CYCLES',
      value: null,
      constraint: 'required',
      suggestion: 'Specify the number of refinement cycles'
    },
    {
      parameter: 'XYZIN',
      value: '/nonexistent/file.pdb',
      constraint: 'file_exists',
      suggestion: 'Select an existing coordinate file'
    },
    {
      parameter: 'WEIGHT',
      value: 15.0,
      constraint: '0.1 <= value <= 10.0',
      suggestion: 'Use a value between 0.1 and 10.0'
    }
  ]
};

<CCP4i2ValidationDisplay
  validation={complexValidation}
  collapsible={true}
  maxHeight={200}
/>
```

## Severity Levels

### Error (Red)
- **Use for**: Invalid parameters that prevent task execution
- **Icon**: Error icon (❌)
- **Behavior**: Blocks task submission

### Warning (Orange/Yellow)
- **Use for**: Potentially problematic but not blocking issues
- **Icon**: Warning icon (⚠️)
- **Behavior**: Allows task submission with confirmation

### Info (Blue)
- **Use for**: Informational messages and tips
- **Icon**: Info icon (ℹ️)
- **Behavior**: No blocking behavior

### Success (Green)
- **Use for**: Confirmation of successful validation
- **Icon**: Success icon (✅)
- **Behavior**: Positive feedback

## Styling and Appearance

The component automatically styles based on:

- **Material-UI Alert components**: Consistent with design system
- **Severity-based coloring**: Appropriate colors for each level
- **Responsive design**: Adapts to container width
- **Accessibility**: Screen reader compatible

## Integration with Task Elements

### Automatic Validation Display

Many task elements automatically show validation:

```tsx
<CCP4i2TaskElement
  itemName="CYCLES"
  qualifiers={{ guiLabel: "Cycles" }}
  showValidation={true}  // Shows validation below input
/>
```

### Manual Validation Integration

```tsx
const [validation, setValidation] = useState(null);

const handleParameterChange = (value) => {
  const result = validateParameter('CYCLES', value);
  setValidation(result);
};

<>
  <CCP4i2TaskElement
    itemName="CYCLES"
    qualifiers={{ guiLabel: "Cycles" }}
    onParameterChange={handleParameterChange}
  />
  {validation && (
    <CCP4i2ValidationDisplay validation={validation} />
  )}
</>
```

## Best Practices

1. **Be specific in error messages**: Clearly state what's wrong and how to fix it
2. **Provide actionable suggestions**: Include concrete steps to resolve issues
3. **Use appropriate severity levels**: Don't overwhelm users with false alarms
4. **Keep messages concise**: Long messages can be overwhelming
5. **Group related validations**: Combine similar issues into single messages
6. **Test validation thoroughly**: Ensure all edge cases are handled properly

## Common Validation Scenarios

### File Validation
```tsx
// File doesn't exist
{
  isValid: false,
  severity: 'error',
  messages: ['Selected file does not exist'],
  details: [{
    parameter: 'XYZIN',
    suggestion: 'Select an existing file or check the file path'
  }]
}

// File format warning
{
  isValid: true,
  severity: 'warning',
  messages: ['File format may not be optimal for this task'],
  details: [{
    parameter: 'HKLIN',
    suggestion: 'Consider converting to MTZ format for better performance'
  }]
}
```

### Parameter Range Validation
```tsx
// Value out of range
{
  isValid: false,
  severity: 'error',
  messages: ['Value is outside acceptable range'],
  details: [{
    parameter: 'WEIGHT',
    value: 25.0,
    constraint: '0.1 ≤ value ≤ 10.0',
    suggestion: 'Enter a value between 0.1 and 10.0'
  }]
}
```

### Dependency Validation
```tsx
// Missing dependent parameter
{
  isValid: false,
  severity: 'error',
  messages: ['Required parameter missing when using advanced mode'],
  details: [{
    parameter: 'ADVANCED_PARAM',
    constraint: 'required when MODE = "advanced"',
    suggestion: 'Either provide the parameter or change to basic mode'
  }]
}
```