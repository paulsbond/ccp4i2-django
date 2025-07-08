# Writing a Task Interface

This guide explains how to write a task interface in the project, using `client/renderer/components/task/task-interfaces/parrot.tsx` as a reference.

## 1. File Structure

Task interfaces are React components located in:

```
client/renderer/components/task/task-interfaces/
```

The appropriate interface to use for a given ccp4i2 task is captured in the file

```
client/renderer/providers/task-container.tsx
```

Each interface is a `.tsx` file named after the task, and registered in `task-container.tsx`. To register the interface in `task-container.tsx`, simply edit `task-container.tsx` to 1) import the task interface file, and 2) add a corresponding `case` to the long switch statement :

```tsx
//At the top of the file:
import ParrotInterface from "../components/task/task-interfaces/parrot";

//In the switch section:

      case "parrot":
        return (
          <ParrotInterface
            {...{
              job,
            }}
          />
        );

```

where`parrot` is the ccp4i2 task name as used in the task's `.def.xml` and python script files.

## 2. Component Boilerplate

Start with a functional React component. Example:

```tsx
import { CCP4i2TaskInterfaceProps } from "../../../providers/task-container";
import { CCP4i2TaskElement } from "../task-elements/task-element";
import { CCP4i2Tab, CCP4i2Tabs } from "../task-elements/tabs";
import { useJob } from "../../../utils";
import { CCP4i2ContainerElement } from "../task-elements/ccontainer";
np;
const TaskInterface: React.FC<CCP4i2TaskInterfaceProps> = (props) => {
  const { job } = props;
  const { getTaskItem } = useJob(job.id);
  const { value: XYZIN_MODE } = getTaskItem("XYZIN_MODE");

  return (
    <CCP4i2Tabs {...props}>
      <CCP4i2Tab tab="Main inputs">
        <CCP4i2ContainerElement
          {...props}
          itemName=""
          qualifiers={{ guiLabel: "Input data" }}
          key="Input data"
          containerHint="FolderLevel"
          initiallyOpen={true}
        >
          <CCP4i2TaskElement
            {...props}
            key="F_SIGF"
            itemName="F_SIGF"
            qualifiers={{ guiLabel: "Reflections" }}
          />
        </CCP4i2ContainerElement>
      </CCP4i2Tab>
    </CCP4i2Tabs>
  );
};

export default ParrotTaskInterface;
```

## 7. Export

Export the component as default.

---

**Tip:** Use `parrot.tsx` as a template for new task interfaces. Keep UI consistent and follow React best practices. Leverage `CCP4i2Tabs`, `CCP4i2Tab`, `CCP4i2ContainerElement`, and `CCP4i2TaskElement` for a standardized UI.
