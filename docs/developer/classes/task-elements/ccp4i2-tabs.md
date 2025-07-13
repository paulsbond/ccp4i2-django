# CCP4i2Tab

## Overview

`CCP4i2Tab` is a React component that represents a single tab within a `CCP4i2Tabs` container. It holds the content that will be displayed when the tab is active and provides the tab label and optional icon.

## Usage

```tsx
import { CCP4i2Tab } from "../task-elements/tabs";

<CCP4i2Tab label="Main Inputs" icon={<SettingsIcon />}>
  <CCP4i2ContainerElement
    itemName=""
    qualifiers={{ guiLabel: "Basic Parameters" }}
    containerHint="FolderLevel"
    initiallyOpen={true}
  >
    {/* Tab content */}
  </CCP4i2ContainerElement>
</CCP4i2Tab>
```

## Props

### Required Props

- **`label`** (`string`): Display text for the tab header
- **`children`** (`ReactNode`): Content to display when tab is active

### Optional Props

- **`icon`** (`ReactNode`): Optional icon to display alongside the label
- **`disabled`** (`boolean`): Whether the tab can be selected (default: false)
- **`value`** (`any`): Custom value for the tab (used internally by CCP4i2Tabs)
- **`className`** (`string`): Additional CSS classes for styling

## Examples

### Basic Tab

```tsx
<CCP4i2Tab label="Input Files">
  <CCP4i2TaskElement itemName="XYZIN" qualifiers={{ guiLabel: "Coordinates" }} />
  <CCP4i2TaskElement itemName="HKLIN" qualifiers={{ guiLabel: "Reflections" }} />
</CCP4i2Tab>
```

### Tab with Icon

```tsx
import { FolderIcon } from "@mui/icons-material";

<CCP4i2Tab label="Files" icon={<FolderIcon />}>
  <CCP4i2ContainerElement
    itemName=""
    qualifiers={{ guiLabel: "Input Files" }}
    containerHint="FolderLevel"
    initiallyOpen={true}
  >
    <CCP4i2TaskElement itemName="XYZIN" qualifiers={{ guiLabel: "Coordinates" }} />
    <CCP4i2TaskElement itemName="HKLIN" qualifiers={{ guiLabel: "Reflections" }} />
  </CCP4i2ContainerElement>
</CCP4i2Tab>
```

### Disabled Tab

```tsx
<CCP4i2Tab label="Advanced Options" disabled={!isExpertMode}>
  <CCP4i2TaskElement itemName="EXPERT_PARAM" qualifiers={{ guiLabel: "Expert Parameter" }} />
</CCP4i2Tab>
```

### Tab with Complex Content

```tsx
<CCP4i2Tab label="Refinement">
  <Grid2 container spacing={2}>
    <Grid2 size={{ xs: 12, md: 6 }}>
      <CCP4i2ContainerElement
        itemName=""
        qualifiers={{ guiLabel: "Basic Settings" }}
        containerHint="BlockLevel"
        initiallyOpen={true}
      >
        <CCP4i2TaskElement itemName="CYCLES" qualifiers={{ guiLabel: "Cycles" }} />
        <CCP4i2TaskElement itemName="WEIGHT" qualifiers={{ guiLabel: "Weight" }} />
      </CCP4i2ContainerElement>
    </Grid2>
    <Grid2 size={{ xs: 12, md: 6 }}>
      <CCP4i2ContainerElement
        itemName=""
        qualifiers={{ guiLabel: "Restraints" }}
        containerHint="BlockLevel"
        initiallyOpen={false}
      >
        <CCP4i2TaskElement itemName="BOND_WEIGHT" qualifiers={{ guiLabel: "Bond Weight" }} />
        <CCP4i2TaskElement itemName="ANGLE_WEIGHT" qualifiers={{ guiLabel: "Angle Weight" }} />
      </CCP4i2ContainerElement>
    </Grid2>
  </Grid2>
</CCP4i2Tab>
```

## Content Organization

### Container Structure

Each tab should typically contain one or more `CCP4i2ContainerElement` components to organize related parameters:

```tsx
<CCP4i2Tab label="Main Parameters">
  <CCP4i2ContainerElement
    itemName=""
    qualifiers={{ guiLabel: "Required Inputs" }}
    containerHint="FolderLevel"
    initiallyOpen={true}
  >
    {/* Required parameters */}
  </CCP4i2ContainerElement>
  
  <CCP4i2ContainerElement
    itemName=""
    qualifiers={{ guiLabel: "Optional Settings" }}
    containerHint="FolderLevel"
    initiallyOpen={false}
  >
    {/* Optional parameters */}
  </CCP4i2ContainerElement>
</CCP4i2Tab>
```

### Grid Layouts

For complex layouts, use Material-UI Grid components:

```tsx
<CCP4i2Tab label="Configuration">
  <Grid2 container spacing={3}>
    <Grid2 size={{ xs: 12, lg: 8 }}>
      {/* Main parameters */}
    </Grid2>
    <Grid2 size={{ xs: 12, lg: 4 }}>
      {/* Side panel or preview */}
    </Grid2>
  </Grid2>
</CCP4i2Tab>
```

## Tab Labels and Icons

### Label Guidelines

- **Keep labels concise**: Aim for 1-2 words when possible
- **Use descriptive terms**: "Input Files" rather than "Files"
- **Be consistent**: Use similar terminology across tabs
- **Consider user workflow**: Order tabs logically

### Icon Selection

Use Material-UI icons that clearly represent the tab content:

```tsx
import {
  FolderIcon,        // For file-related tabs
  SettingsIcon,      // For parameter/settings tabs
  TuneIcon,          // For advanced/tuning tabs
  PlayArrowIcon,     // For execution/run tabs
  AssessmentIcon,    // For results/analysis tabs
  HelpIcon           // For help/documentation tabs
} from "@mui/icons-material";
```

## Conditional Rendering

### Based on Task State

```tsx
const { job } = useJob(jobId);

<CCP4i2Tabs>
  <CCP4i2Tab label="Setup">
    {/* Always available */}
  </CCP4i2Tab>
  
  <CCP4i2Tab label="Results" disabled={job.status !== 'completed'}>
    {/* Only available when job is complete */}
  </CCP4i2Tab>
</CCP4i2Tabs>
```

### Based on User Preferences

```tsx
const { isExpertMode } = useUserPreferences();

<CCP4i2Tabs>
  <CCP4i2Tab label="Basic">
    {/* Standard parameters */}
  </CCP4i2Tab>
  
  {isExpertMode && (
    <CCP4i2Tab label="Expert">
      {/* Expert-only parameters */}
    </CCP4i2Tab>
  )}
</CCP4i2Tabs>
```

## Styling and Theming

The component automatically inherits styling from the parent `CCP4i2Tabs` component and follows the Material-UI theming system. Custom styling can be applied through:

- **className prop**: For custom CSS classes
- **Material-UI sx prop**: For inline styling (if supported)
- **Theme customization**: Through the Material-UI theme provider

## Accessibility

The component includes built-in accessibility features:

- **ARIA labels**: Proper labeling for screen readers
- **Keyboard navigation**: Tab key navigation support
- **Focus management**: Proper focus handling when switching tabs
- **Role attributes**: Correct ARIA roles for tab components

## Best Practices

1. **Organize content logically**: Group related parameters within each tab
2. **Use consistent structure**: Similar layout patterns across tabs
3. **Minimize tab count**: Keep to 3-5 tabs for optimal usability
4. **Provide visual hierarchy**: Use containers to structure content within tabs
5. **Handle empty states**: Provide meaningful content when tabs have no parameters
6. **Test accessibility**: Ensure keyboard navigation and screen reader compatibility