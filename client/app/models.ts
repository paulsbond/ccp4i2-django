export class Project {
  constructor(
    public id: number,
    public uuid: string,
    public name: string,
    public creation_time: string,
    public last_access: string
  ) {}
}

export class ProjectTag {
  constructor(
    public id: number,
    public text: string,
    public parent?: number,
    public projects: number[] = []
  ) {}
}

export class File {
  constructor(
    public id: number,
    public uuid: string,
    public file: string,
    public type: string,
    public name: string,
    public size: number,
    public job: number,
    public annotation: string
  ) {}
}

export class Job {
  constructor(
    public id: number,
    public project: number,
    public parent: number,
    public uuid: string,
    public title: string,
    public number: string,
    public task_name: string,
    public status: number
  ) {}
}

export class JobFloatValue {
  constructor(
    public id: number,
    public job: number,
    public key: string,
    public value: number
  ) {}
}

export class JobCharValue {
  constructor(
    public id: number,
    public job: number,
    public key: string,
    public value: string
  ) {}
}
