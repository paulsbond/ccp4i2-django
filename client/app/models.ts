export class Project {
  constructor(
    public id: number,
    public uuid: string,
    public name: string,
    public creation_time: string
  ) {}
}

export class File {
  constructor(
    public id: number,
    public file: string,
    public name: string,
    public size: number,
    public job: number
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
    public task_name: string
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
