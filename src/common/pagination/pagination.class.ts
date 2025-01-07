export class PagedData<Type> {
  constructor(
    public readonly result: Type[],
    public readonly total: number,
    public readonly page: number,
    public readonly limit: number,
    public readonly nextPage: boolean = false,
    public readonly prevPage: boolean = false,
    public readonly totalPages: number = 1,
  ) {
    this.result = result;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
    this.nextPage = page < this.totalPages;
    this.prevPage = page > 1;
  }
}
