# CCP4i2TaskElement

## Overview

`CCP4i2TaskElement` is a React component that renders individual task parameters/inputs within a CCP4i2 task interface. It serves as a wrapper around various input types (text, number, file, dropdown, etc.) and handles parameter validation, change events, and integration with the task system.

## Usage

```tsx
import { CCP4i2TaskElement } from "../task-elements/task-element";

<CCP4i2TaskElement
  itemName="INPUT_FILE"
  qualifiers={{ guiLabel: "Input File" }}
  onChange={(value) => console.log("Changed to:", value)}
  disabled={false}
/>;
```

## Props

### Required Props

- **`itemName`** (`string`): The name of the task parameter as defined in the task definition
- **`qualifiers`** (`object`): Configuration object containing display and validation rules

### Optional Props

- **`onChange`** (`function`): Callback fired when parameter value changes successfully
- **`onParameterChangeFailure`** (`function`): Callback fired when parameter validation fails
- **`disabled`** (`boolean`): Whether the input should be disabled
- **`size`** (`object`): Grid sizing configuration (e.g., `{ xs: 12, sm: 6 }`)
- **`key`** (`string`): React key prop for list rendering

### Qualifiers Object

The `qualifiers` prop accepts an object with the following properties:

- **`guiLabel`** (`string`): Display label for the parameter
- **`toolTip`** (`string`): Tooltip text shown on hover
- **`validation`** (`object`): Validation rules
- **`defaultValue`** (`any`): Default value for the parameter
- **`options`** (`array`): Options for dropdown/select inputs
- **`fileFilter`** (`string`): File type filter for file inputs
- **`required`** (`boolean`): Whether the parameter is required

## Examples

### Basic Text Input

```tsx
<CCP4i2TaskElement
  itemName="TITLE"
  qualifiers={{
    guiLabel: "Job Title",
    toolTip: "Enter a descriptive title for this job",
  }}
/>
```

### File Input with Filter

```tsx
<CCP4i2TaskElement
  itemName="XYZIN"
  qualifiers={{
    guiLabel: "Input Coordinates",
    fileFilter: "*.pdb,*.cif",
    required: true,
  }}
/>
```

### Dropdown Selection

```tsx
<CCP4i2TaskElement
  itemName="METHOD"
  qualifiers={{
    guiLabel: "Refinement Method",
    options: [
      { value: "restrained", label: "Restrained" },
      { value: "unrestrained", label: "Unrestrained" },
    ],
    defaultValue: "restrained",
  }}
/>
```

### Number Input with Validation

```tsx
<CCP4i2TaskElement
  itemName="CYCLES"
  qualifiers={{
    guiLabel: "Number of Cycles",
    validation: { min: 1, max: 100 },
    defaultValue: 5,
  }}
/>
```

## Events

### onChange

Fired when a parameter value is successfully changed and validated.

```tsx
onChange={(newValue, parameterName) => {
  console.log(`Parameter ${parameterName} changed to:`, newValue);
}}
```

### onParameterChangeFailure

Fired when parameter validation fails.

```tsx
onParameterChangeFailure={(error, parameterName) => {
  console.error(`Validation failed for ${parameterName}:`, error);
}}
```

## Integration with Task System

The component automatically integrates with the CCP4i2 task system to:

- Retrieve current parameter values from the task
- Update parameter values when changed
- Validate inputs according to task definition rules
- Handle file path resolution and validation
- Manage parameter dependencies and conditional display

## Styling and Layout

The component uses Material-UI components and follows the CCP4i2 design system. It automatically handles:

- Responsive grid layout
- Consistent spacing and typography
- Error state styling
- Loading states
- Accessibility features

## Best Practices

1. **Always provide descriptive `guiLabel`s** for better user experience
2. **Use `toolTip`s for complex parameters** that need explanation
3. **Set appropriate validation rules** to prevent invalid inputs
4. **Handle parameter change events** when dependent parameters need updates
5. **Use semantic `itemName`s** that match the task definition exactly
