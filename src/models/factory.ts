export interface Factory<T> {
    make(json: any): T;
    getCollectionName(): string;
    getURL(id?: string): string;
}
