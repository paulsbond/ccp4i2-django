import $ from "jquery";
import { useCallback, useMemo } from "react";
import { useEffect, useRef } from "react";
import { useApi } from "./api";
import {
  Job,
  JobCharValue,
  JobFloatValue,
  Project,
  File as DjangoFile,
} from "./models";

/**
 * Checks if the given path ends with the specified name, considering dot notation.
 *
 * @param path - The path to check, which can be a string, null, or undefined.
 * @param name - The name to match at the end of the path.
 * @returns A boolean indicating whether the path ends with the specified name.
 */
const pathMatch = (path: string | null | undefined, name: string) => {
  if (!path) return false;
  const dottedName = `.${name}`.replace("..", ".");
  const dottedPath = `.${path}`.replace("..", ".");
  return dottedPath.endsWith(dottedName);
};
/**
 * Recursively searches for items within a container that match a specified name.
 *
 * @param name - The name to search for within the container's `_objectPath`.
 * @param container - The container object to search within. This can be an object with nested items.
 * @param multiple - A boolean indicating whether to find multiple items (default is true). If false, the search stops after finding the first match.
 * @param growingList - An optional array to accumulate found items. If not provided, a new array is created.
 * @returns An array of found items that match the specified name.
 */
const findItems = (
  name: string,
  container: any,
  multiple: boolean = false,
  growingList?: any[]
): any[] => {
  const listToGrow = growingList ? growingList : [];
  const originalLength = listToGrow.length;
  if (pathMatch(container?._objectPath, name)) {
    listToGrow.push(container);
    if (!multiple) return listToGrow;
  } else if (container._baseClass === "CList") {
    container._value.forEach((item: any) => {
      if (pathMatch(item?._objectPath, name)) {
        listToGrow.push(item);
        if (!multiple) return listToGrow;
      } else {
        findItems(name, item, multiple, listToGrow);
        if (!multiple && listToGrow.length > originalLength) return listToGrow;
      }
    });
  } else if (container._value?.constructor == Object) {
    try {
      Object.keys(container._value).forEach((key: string) => {
        const item = container._value[key];
        if (pathMatch(item?._objectPath, name)) {
          listToGrow.push(item);
          if (!multiple) return listToGrow;
        } else {
          findItems(name, item, multiple, listToGrow);
          if (!multiple && listToGrow.length > originalLength)
            return listToGrow;
        }
      });
    } catch (err) {
      console.error(err);
    }
  }
  return listToGrow;
};

/**
 * Retrieves items from a container that match the specified name.
 *
 * @param name - The name of the items to search for.
 * @param container - The container in which to search for items.
 * @param multiple - A boolean indicating whether to return multiple items. Defaults to `false`.
 * @returns An array of items that match the specified name.
 */
export const itemsForName = (
  name: string,
  container: any,
  multiple: boolean = false
) => {
  const itemMatches = findItems(name, container, multiple);
  return itemMatches;
};

export interface SetParameterArg {
  object_path: string;
  value: any;
}

/**
 * Custom hook to fetch and manage project-related data.
 *
 * @param {number} projectId - The ID of the project to fetch data for.
 * @returns {object} An object containing project data and mutate functions:
 * - `project`: The project data.
 * - `mutateProject`: Function to mutate the project data.
 * - `directory`: The directory data of the project.
 * - `mutateDirectory`: Function to mutate the directory data.
 * - `jobs`: The jobs associated with the project.
 * - `mutateJobs`: Function to mutate the jobs data.
 * - `files`: The files associated with the project.
 * - `mutateFiles`: Function to mutate the files data.
 * - `jobFloatValues`: The float values of the jobs.
 * - `mutateJobFloatValues`: Function to mutate the job float values data.
 * - `jobCharValues`: The char values of the jobs.
 * - `mutateJobCharValues`: Function to mutate the job char values data.
 */
export const useProject = (projectId: number) => {
  const api = useApi();
  const { data: project, mutate: mutateProject } = api.get_endpoint<Project>({
    type: "projects",
    id: projectId,
    endpoint: "",
  });
  const { data: directory, mutate: mutateDirectory } = api.get_endpoint<any>({
    type: "projects",
    id: projectId,
    endpoint: "directory",
  });
  const { data: jobs, mutate: mutateJobs } = api.get_endpoint<Job[]>({
    type: "projects",
    id: projectId,
    endpoint: "jobs",
  });
  const { data: files, mutate: mutateFiles } = api.get_endpoint<DjangoFile[]>({
    type: "projects",
    id: projectId,
    endpoint: "files",
  });
  const { data: jobFloatValues, mutate: mutateJobFloatValues } =
    api.get_endpoint<JobFloatValue[]>({
      type: "projects",
      id: projectId,
      endpoint: "job_float_values",
    });
  const { data: jobCharValues, mutate: mutateJobCharValues } = api.get_endpoint<
    JobCharValue[]
  >({ type: "projects", id: projectId, endpoint: "job_char_values" });
  return {
    project,
    mutateProject,
    directory,
    mutateDirectory,
    jobs,
    mutateJobs,
    files,
    mutateFiles,
    jobCharValues,
    mutateJobCharValues,
    jobFloatValues,
    mutateJobFloatValues,
  };
};

/**
 * Custom hook to manage job-related data and actions.
 *
 * @param job - The job object containing job details.
 * @returns An object containing various utilities and data related to the job.
 *
 * @property useAsyncEffect - A function to run an asynchronous effect with dependencies.
 * @property setParameter - A function to set a parameter for the job if it is in a pending state.
 * @property getTaskItem - A function to get a task item by its parameter name.
 * @property getTaskValue - A function to get the value of a task item by its parameter name.
 * @property getValidationColor - A function to get the validation color for a given item.
 * @property getErrors - A function to get validation errors for a given item.
 * @property container - The container data for the job.
 * @property mutateContainer - A function to mutate the container data.
 * @property params_xml - The parameters XML data for the job.
 * @property mutateParams_xml - A function to mutate the parameters XML data.
 * @property validation - The validation data for the job.
 * @property mutateValidation - A function to mutate the validation data.
 * @property report_xml - The report XML data for the job.
 * @property mutateReport_xml - A function to mutate the report XML data.
 * @property diagnostic_xml - The diagnostic XML data for the job.
 * @property mutateDiagnosticXml - A function to mutate the diagnostic XML data.
 * @property def_xml - The definition XML data for the job.
 * @property mutateDef_xml - A function to mutate the definition XML data.
 */
export const useJob = (jobId: number | null | undefined) => {
  const api = useApi();

  const { data: job, mutate: mutateJob } = api.get_endpoint<Job>({
    type: "jobs",
    id: jobId,
    endpoint: "",
  });

  const { data: container, mutate: mutateContainer } =
    api.get_wrapped_endpoint_json<any>({
      type: "jobs",
      id: jobId,
      endpoint: "container",
    });

  const { data: params_xml, mutate: mutateParams_xml } =
    api.get_pretty_endpoint_xml({
      type: "jobs",
      id: jobId,
      endpoint: "params_xml",
    });

  const { data: validation, mutate: mutateValidation } = api.get_validation({
    type: "jobs",
    id: jobId,
    endpoint: "validation",
  });

  const { data: report_xml, mutate: mutateReport_xml } = api.get_endpoint_xml({
    type: "jobs",
    id: jobId,
    endpoint: "report_xml",
  });

  const { data: diagnostic_xml, mutate: mutateDiagnosticXml } =
    api.get_pretty_endpoint_xml({
      type: "jobs",
      id: jobId,
      endpoint: "diagnostic_xml",
    });

  const { data: def_xml, mutate: mutateDef_xml } = api.get_pretty_endpoint_xml({
    type: "jobs",
    id: jobId,
    endpoint: "def_xml",
  });

  return {
    useAsyncEffect: (effect: () => Promise<void>, dependencies: any[]) => {
      useEffect(() => {
        const executeEffect = async () => {
          await effect();
        };

        executeEffect();
      }, dependencies);
    },

    setParameter: useCallback(
      async (setParameterArg: SetParameterArg) => {
        if (job?.status == 1) {
          const result = await api.post<Job>(
            `jobs/${job.id}/set_parameter`,
            setParameterArg
          );
          await mutateContainer();
          await mutateParams_xml();
          await mutateValidation();
          return result;
        } else
          console.log(
            "Alert attempting to edit interface of task not in pending state"
          );
      },
      [job, mutateContainer, mutateValidation, mutateParams_xml]
    ),

    getTaskItem: useMemo(() => {
      return (param_name: string) => {
        if (param_name?.length == 0) return null;
        return itemsForName(param_name, container, false)[0];
      };
    }, [container]),

    getTaskValue: useMemo(() => {
      return (param_name: string) => {
        const item = itemsForName(param_name, container, false)[0];
        return valueOfItem(item);
      };
    }, [container]),

    getValidationColor: useMemo(() => {
      return (item: any) => {
        const fieldErrors = errorsInValidation(item, validation);
        return validationColor(fieldErrors);
      };
    }, [validation]),

    getErrors: useMemo(() => {
      return (item: any) => errorsInValidation(item, validation);
    }, [validation]),

    getFileDigest: useMemo(() => {
      return (objectPath: string) => {
        return api.digest<any>(
          `jobs/${job?.id}/digest?object_path=${objectPath}`
        );
      };
    }, [job]),
    job,
    mutateJob,
    container,
    mutateContainer,
    params_xml,
    mutateParams_xml,
    validation,
    mutateValidation,
    report_xml,
    mutateReport_xml,
    diagnostic_xml,
    mutateDiagnosticXml,
    def_xml,
    mutateDef_xml,
  };
};

/**
 * Reads the contents of a file and returns a promise that resolves with the file's contents.
 *
 * @param file - The file to be read.
 * @param readAs - The format in which to read the file. Can be "Text", "ArrayBuffer", or "File". Defaults to "Text".
 * @returns A promise that resolves with the file's contents as a string, ArrayBuffer, or the File object itself.
 *
 * @example
 * ```typescript
 * const file = new File(["Hello, world!"], "hello.txt", { type: "text/plain" });
 * readFilePromise(file, "Text").then((content) => {
 *   console.log(content); // "Hello, world!"
 * });
 * ```
 */
export const readFilePromise = async (
  file: File,
  readAs: "Text" | "ArrayBuffer" | "File" = "Text"
): Promise<string | ArrayBuffer | null | File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onabort = () => reject();
    reader.onerror = () => reject();
    reader.onloadend = () => {
      // Do whatever you want with the file contents
      const textOrBuffer = reader.result;
      return resolve(textOrBuffer);
    };
    if (readAs === "Text") {
      reader.readAsText(file);
    } else if (readAs === "ArrayBuffer") {
      reader.readAsArrayBuffer(file);
    } else if (readAs === "File") {
      return resolve(file);
    }
  });
};

/**
 * Extracts the value of an item, handling various data types including primitives, objects, and arrays.
 *
 * @param item - The item from which to extract the value. It can be of any type.
 * @returns The extracted value, which can be of any type, or `null` if the item is falsy.
 *
 * The function handles the following cases:
 * - If the item is falsy, it returns `null`.
 * - If the item's `_value` is `undefined`, `null`, a string, a number, or a boolean, it returns `_value`.
 * - If the item's `_value` is an object, it recursively extracts values for each key in the object.
 * - If the item's `_value` is an array, it recursively extracts values for each element in the array.
 * - If the item's `_value` is of an unknown type, it logs the item to the console.
 */
export const valueOfItem = (item: any): any => {
  if (!item) return null;
  else if (
    typeof item._value === "undefined" ||
    item._value === undefined ||
    item._value === null ||
    typeof item._value === "string" ||
    typeof item._value === "number" ||
    typeof item._value === "boolean"
  ) {
    return item._value;
  } else if (item._value.constructor == Object) {
    const result: any = {};
    Object.keys(item._value).forEach(
      (key: string) => (result[key] = valueOfItem(item._value[key]))
    );
    return result;
  } else if (Array.isArray(item._value)) {
    if (item._value.length == 0) return [];
    const result: any[] = item._value.map((value: any) => valueOfItem(value));
    return result;
  } else {
    console.log("Unknown item", item._value);
  }
};

/**
 * Determines the appropriate validation color based on the presence and severity of field errors.
 *
 * @param {any[]} fieldErrors - An array of field error objects.
 * @returns {string} - Returns "success.light" if there are no errors, "warning.light" if there are warnings, and "error.light" if there are errors.
 */
export const validationColor = (fieldErrors: any): string => {
  return !fieldErrors
    ? "success.light"
    : fieldErrors.maxSeverity == 0
    ? "success.light"
    : fieldErrors && fieldErrors.maxSeverity == 1
    ? "warning.light"
    : "error.light";
};

/**
 * Custom hook that returns the previous value of the given input.
 *
 * @template T - The type of the value.
 * @param {T} value - The current value.
 * @returns {T | undefined} - The previous value of the input, or undefined if there is no previous value.
 */
export const usePrevious = <T>(value: T): T | undefined => {
  const ref = useRef<T | undefined>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
};

/**
 * Extracts validation errors for a given item based on the provided validation object.
 *
 * @param item - The item to check for validation errors. It can be of any type.
 * @param validation - An XML Document containing validation details.
 *
 * @returns An array of objects, each containing the severity and description of a validation error.
 *          If no errors are found, an empty array is returned.
 */
const errorsInValidation = (item: any, validation: any): any | null => {
  if (validation) {
    return validation[item._objectPath];
  }
  return null;
};
