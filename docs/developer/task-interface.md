# Writing a Task Interface

This guide explains how to write a task interface in the project, using `client/renderer/components/task/task-interfaces/parrot.tsx` as a reference.

## 1. File Structure

Task interfaces are React components located in:

```
client/renderer/components/task/task-interfaces/
```

Each interface is a `.tsx` file named after the task.

## 2. Component Boilerplate

Start with a functional React component. Example:

```tsx
import React from "react";
import {
  CCP4i2Tabs,
  CCP4i2Tab,
  CCP4i2ContainerElement,
  CCP4i2TaskElement,
} from "../task-elements";
import { TaskInterfaceProps } from "../types";

const ParrotTaskInterface: React.FC<TaskInterfaceProps> = (props) => {
  return (
    <CCP4i2Tabs>
      <CCP4i2Tab tab="Main">
        <CCP4i2ContainerElement
          itemName=""
          qualifiers={{ guiLabel: "Main Parameters" }}
          containerHint="FolderLevel"
          initiallyOpen={true}
          size={{ xs: 12 }}
        >
          <CCP4i2TaskElement
            {...props}
            itemName="INPUT_VALUE"
            qualifiers={{ guiLabel: "Input Value" }}
            onParameterChangeSuccess={(val) =>
              props.onChange({
                ...props.task,
                parameters: { ...props.task.parameters, inputValue: val },
              })
            }
            disabled={props.readonly}
          />
        </CCP4i2ContainerElement>
      </CCP4i2Tab>
      <CCP4i2Tab tab="Advanced">
        {/* Additional fields or settings */}
      </CCP4i2Tab>
    </CCP4i2Tabs>
  );
};

export default ParrotTaskInterface;
```

## 3. Props

All task interfaces receive `TaskInterfaceProps`, which typically include:

- `task`: Task data and configuration.
- `onChange`: Callback for updating task state.
- `readonly`: Boolean for read-only mode.

## 4. Using CCP4i2Tabs and Related Components

- **CCP4i2Tabs**: Provides a tabbed interface for organizing fields.
- **CCP4i2Tab**: Represents a single tab, labeled via the `label` prop.
- **CCP4i2ContainerElement**: Groups related form elements for layout.
- **CCP4i2TaskElement**: Renders a labeled input field, handling value and change events.

Example usage is shown in the boilerplate above.

## 5. Handling Read-Only Mode

Disable inputs if `props.readonly` is true by passing `disabled={props.readonly}` to `CCP4i2TaskElement`.

## 6. Custom Logic

Implement any task-specific logic, such as validation or dynamic fields, within the component.

## 7. Export

Export the component as default.

---

**Tip:** Use `parrot.tsx` as a template for new task interfaces. Keep UI consistent and follow React best practices. Leverage `CCP4i2Tabs`, `CCP4i2Tab`, `CCP4i2ContainerElement`, and `CCP4i2TaskElement` for a standardized UI.
