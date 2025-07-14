# CCP4i2FileInput

## Overview

`CCP4i2FileInput` is a specialized React component for handling file selection and management within CCP4i2 task interfaces. It provides file browsing, validation, and integration with the CCP4i2 file system.

## Usage

```tsx
import { CCP4i2FileInput } from "../task-elements/file-input";

<CCP4i2FileInput
  itemName="XYZIN"
  qualifiers={{
    guiLabel: "Input Coordinates",
    fileFilter: "*.pdb,*.cif,*.mmcif",
  }}
  onFileChange={(filePath) => console.log("Selected:", filePath)}
/>;
```

## Props

### Required Props

- **`itemName`** (`string`): Parameter name for the file input
- **`qualifiers`** (`object`): Configuration object with file-specific settings

### Optional Props

- **`onFileChange`** (`function`): Callback fired when file selection changes
- **`onValidationChange`** (`function`): Callback fired when file validation changes
- **`disabled`** (`boolean`): Whether file selection is disabled
- **`required`** (`boolean`): Whether a file must be selected
- **`multiple`** (`boolean`): Whether multiple files can be selected

### File-Specific Qualifiers

- **`qualifiers.mimeTypeName`** (`string` | `string`[]): Comma-separated list of allowed file extensions
- **`fileType`** (`string`): Expected file type ("coordinate", "reflection", "map", etc.)
- **`mustExist`** (`boolean`): Whether the file must exist on disk
- **`allowCreation`** (`boolean`): Whether new files can be created

## Examples

### Coordinate File Input

```tsx
<CCP4i2FileInput
  itemName="XYZIN"
  qualifiers={{
    guiLabel: "Input Coordinates",
    fileFilter: "*.pdb,*.cif,*.mmcif",
    fileType: "coordinate",
    mustExist: true,
  }}
  required={true}
  onFileChange={(filePath) => {
    // Validate coordinate file
    validateCoordinateFile(filePath);
  }}
/>
```

### Reflection Data Input

```tsx
<CCP4i2FileInput
  itemName="HKLIN"
  qualifiers={{
    guiLabel: "Reflection Data",
    fileFilter: "*.mtz,*.cif",
    fileType: "reflection",
  }}
  onFileChange={(filePath) => {
    // Extract column information
    extractMtzColumns(filePath);
  }}
/>
```

### Output File Specification

```tsx
<CCP4i2FileInput
  itemName="XYZOUT"
  qualifiers={{
    guiLabel: "Output Coordinates",
    fileFilter: "*.pdb,*.cif",
    allowCreation: true,
    defaultExtension: ".pdb",
  }}
  onFileChange={(filePath) => {
    // Set up output path
    setupOutputPath(filePath);
  }}
/>
```

### Multiple File Selection

```tsx
<CCP4i2FileInput
  itemName="RESTRAINT_FILES"
  qualifiers={{
    guiLabel: "Additional Restraints",
    fileFilter: "*.cif,*.lib",
  }}
  multiple={true}
  onFileChange={(filePaths) => {
    console.log("Selected files:", filePaths);
  }}
/>
```

## File Validation

The component automatically validates files based on:

- **Extension matching**: Against the provided file filter
- **File existence**: If `mustExist` is true
- **File format**: Basic format validation for known types
- **File size**: Reasonable size limits for safety
- **Permissions**: Read/write access as needed

### Validation States

- **Valid**: File passes all validation checks (green indicator)
- **Warning**: File has potential issues but is usable (yellow indicator)
- **Error**: File fails validation and cannot be used (red indicator)
- **Missing**: Required file not selected (red indicator)

## File Browser Integration

The component integrates with the system file browser and CCP4i2 file management:

- **Native file dialogs**: Platform-appropriate file selection
- **Recent files**: Quick access to recently used files
- **Project files**: Easy selection from current project
- **File preview**: Basic file information and preview when available

## Events and Callbacks

### onFileChange

Fired when file selection changes.

```tsx
onFileChange={(filePath: string | string[]) => {
  if (Array.isArray(filePath)) {
    console.log("Multiple files selected:", filePath);
  } else {
    console.log("Single file selected:", filePath);
  }
}}
```

### onValidationChange

Fired when file validation status changes.

```tsx
onValidationChange={(isValid: boolean, errors: string[]) => {
  if (!isValid) {
    console.error("File validation errors:", errors);
  }
}}
```

## Best Practices

1. **Use appropriate file filters** to limit selection to valid formats
2. **Provide clear labels** that indicate the expected file type
3. **Handle validation errors gracefully** with user-friendly messages
4. **Consider file size and format** for performance
5. **Test with various file types** to ensure robust validation
6. **Provide helpful tooltips** for complex file requirements

## Common File Types

### Coordinate Files

- **Extensions**: `.pdb`, `.cif`, `.mmcif`, `.ent`
- **Validation**: Check for valid coordinate format
- **Usage**: Structure input/output

### Reflection Files

- **Extensions**: `.mtz`, `.cif`, `.hkl`
- **Validation**: Check for column presence and data format
- **Usage**: Experimental data input

### Map Files

- **Extensions**: `.map`, `.ccp4`, `.mrc`
- **Validation**: Check map dimensions and format
- **Usage**: Electron density maps

### Parameter Files

- **Extensions**: `.cif`, `.lib`, `.param`
- **Validation**: Check parameter syntax
- **Usage**: Refinement restraints and parameters
