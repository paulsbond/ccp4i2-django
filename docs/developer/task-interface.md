# Writing a Task Interface

This guide explains how to write a task interface in the project, using `client/renderer/components/task/task-interfaces/parrot.tsx` as a reference.

## 1. File Structure

Task interfaces are React components located in:

```
client/renderer/components/task/task-interfaces/
```

The appropriate interface to use for a given ccp4i2 task is captured in the file

```
client/renderer/task/task-interfaces/task-container.tsx
```

Each interface is a `.tsx` file named after the task, and registered in `task-container.tsx`. To register the interface in `task-container.tsx`, simply edit `task-container.tsx` to 1) import the task interface file, and 2) add a corresponding `case` to the long switch statement :

```tsx
//At the top of the file:
import ParrotInterface from "../components/task/task-interfaces/parrot";

//In the switch section:

      case "parrot":
        return (
          <ParrotInterface job={job} />
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
      <CCP4i2Tab label="Main inputs">
        <CCP4i2ContainerElement
          {...props}
          itemName=""
          key="Input data"
          containerHint="FolderLevel"
          initiallyOpen={true}
        >
          <CCP4i2TaskElement {...props} key="F_SIGF" itemName="F_SIGF" />
        </CCP4i2ContainerElement>
      </CCP4i2Tab>
    </CCP4i2Tabs>
  );
};

export default ParrotTaskInterface;
```

## 7. Export

Export the component as default.

## 8. Structuring an interface

### 8.1 Tabs

To provide a tabbed interface, embed a number of `CCP4i2Tab` elements within a `CCP4i2Tabs` element. For details see [here](./classes/task-elements/ccp4i2-tabs.md)

### 8.2 Containers

Layout of `CCP4i2TaskElement`s and other components can be achieved using the mui material `Grid`, and `Stack` elements. Stylistically consistent hierarchical layout of items is also possible using the `CCP4i2ContainerElement` described [here](./classes/task-elements/ccp4i2-container-element.md). In addition to organising child-elements explicitly embedded within it, the `CCP4i2ContainerElement` can be used to provide default rendering for a whol folder of elements from a tasks `.def.xml` file

## 8. Customising an element

### 8.1 using sxProps

To change aspects of appearance that map eventually in to `css`, use the `sx` property of a `CCP4i2TaskElement`. For example to

### 8.2 Using qualifiers

Some of the customisation of a task element is achieved by overriding the element's qualifiers. The default values for these come from the task `.def.xml` file, but they can be overridden using the `qualifiers` property of a CCP4i2 TaskElemnt. For example, to provide a different guilabel, specify your preferred label in the dictionary that is the qualifiers property:

```tsx
<CCP4i2TaskElement
  {...props}
  key="F_SIGF"
  itemName="F_SIGF"
  qualifiers={{ guiLabel: "Reflections to use" }}
/>
```

**Tip:** Use `parrot.tsx` as a template for new task interfaces. Keep UI consistent and follow React best practices. Leverage `CCP4i2Tabs`, `CCP4i2Tab`, `CCP4i2ContainerElement`, and `CCP4i2TaskElement` for a standardized UI.
