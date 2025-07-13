# CCP4i2ContainerElement

## Overview

`CCP4i2ContainerElement` is a React component that provides a collapsible container for grouping related task parameters. It supports different visual styles and can be nested to create hierarchical parameter organization. If given an `itemName` argument, it will look for a matchingg element in the job container and embed the contents thereof with default widgets.

## Usage

```tsx
import { CCP4i2ContainerElement } from "../task-elements/ccontainer";

<CCP4i2ContainerElement
  itemName=""
  qualifiers={{ guiLabel: "Input Parameters" }}
  containerHint="FolderLevel"
  initiallyOpen={true}
  size={{ xs: 12 }}
>
  <CCP4i2TaskElement
    itemName="PARAM1"
    qualifiers={{ guiLabel: "Parameter 1" }}
  />
  <CCP4i2TaskElement
    itemName="PARAM2"
    qualifiers={{ guiLabel: "Parameter 2" }}
  />
</CCP4i2ContainerElement>;
```

## Props

### Required Props

- **`qualifiers`** (`object`): Configuration object containing display properties

### Optional Props

- **`itemName`** (`string`): Usually empty string for containers, but if present the corresponding nested elements wil be rendered with default CCP4i2TaskElements
- **`children`** (`ReactNode`): Child components to be contained within the container
- **`containerHint`** (`string`): Visual style hint ("FolderLevel", "BlockLevel", "GroupLevel")
- **`initiallyOpen`** (`boolean`): Whether container starts expanded (default: false)
- **`size`** (`object`): Grid sizing configuration
- **`collapsible`** (`boolean`): Whether the container can be collapsed (default: true)
- **`disabled`** (`boolean`): Whether the container and its children are disabled

### Container Hints

Different `containerHint` values provide different visual styles:

- **`"FolderLevel"`**: Top-level folder style with prominent header
- **`"BlockLevel"`**: Mid-level block style with card-like appearance
- **`"GroupLevel"`**: Subtle grouping with minimal visual separation

## Examples

### Top-Level Parameter Group

```tsx
<CCP4i2ContainerElement
  itemName=""
  qualifiers={{ guiLabel: "Refinement Parameters" }}
  containerHint="FolderLevel"
  initiallyOpen={true}
  size={{ xs: 12 }}
>
  <CCP4i2TaskElement itemName="CYCLES" qualifiers={{ guiLabel: "Cycles" }} />
  <CCP4i2TaskElement itemName="WEIGHT" qualifiers={{ guiLabel: "Weight" }} />
</CCP4i2ContainerElement>
```

### Nested Containers

```tsx
<CCP4i2ContainerElement
  itemName=""
  qualifiers={{ guiLabel: "Advanced Options" }}
  containerHint="FolderLevel"
  initiallyOpen={false}
>
  <CCP4i2ContainerElement
    itemName=""
    qualifiers={{ guiLabel: "Geometry Restraints" }}
    containerHint="BlockLevel"
    initiallyOpen={true}
  >
    <CCP4i2TaskElement
      itemName="BOND_WEIGHT"
      qualifiers={{ guiLabel: "Bond Weight" }}
    />
    <CCP4i2TaskElement
      itemName="ANGLE_WEIGHT"
      qualifiers={{ guiLabel: "Angle Weight" }}
    />
  </CCP4i2ContainerElement>
</CCP4i2ContainerElement>
```

### Grid Layout Container

```tsx
<CCP4i2ContainerElement
  itemName=""
  qualifiers={{ guiLabel: "File Inputs" }}
  containerHint="BlockLevel"
  initiallyOpen={true}
>
  <Grid2 container spacing={2}>
    <Grid2 size={{ xs: 12, sm: 6 }}>
      <CCP4i2TaskElement
        itemName="XYZIN"
        qualifiers={{ guiLabel: "Coordinates" }}
      />
    </Grid2>
    <Grid2 size={{ xs: 12, sm: 6 }}>
      <CCP4i2TaskElement
        itemName="HKLIN"
        qualifiers={{ guiLabel: "Reflections" }}
      />
    </Grid2>
  </Grid2>
</CCP4i2ContainerElement>
```

## Styling

The container automatically applies appropriate styling based on:

- **Container hint level**: Different visual prominence
- **Expansion state**: Smooth animations for open/close
- **Content overflow**: Proper scrolling when needed
- **Responsive design**: Adapts to different screen sizes

## Accessibility

The component includes:

- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Focus management for expand/collapse

## Best Practices

1. **Use appropriate container hints** to create clear visual hierarchy
2. **Group related parameters** together logically
3. **Set reasonable initial states** (open for important parameters, closed for advanced options)
4. **Avoid deep nesting** (maximum 2-3 levels for usability)
5. **Use descriptive labels** that clearly indicate the container's purpose
