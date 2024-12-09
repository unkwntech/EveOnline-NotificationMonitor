export interface Factory<T> {
    make(json: any): T;
    collectionName: string;
    getURL(id?: string): string;
}
