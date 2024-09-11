import { swaggerMethod } from "./swaggermethod.model";

export interface swaggerPath {
    [key: string]: swaggerMethod;
}
