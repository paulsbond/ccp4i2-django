export class Project {
  constructor(
    public id: number,
    public uuid: string,
    public name: string,
    public created: string
  ) {}
}

export class File {
  constructor(public id: number, public file: string, public project: number) {}
}
