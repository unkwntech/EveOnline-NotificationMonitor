import { swaggerResponse } from "./swaggerResponse.model";
import { swaggerParameter } from "./swaggerparameter.model";
import { swaggerPath } from "./swaggerpath.model";

export interface swagger {
    swagger: string;
    info: {
        title: string;
        description: string;
        version: string;
    };
    host: string;
    basePath: string;
    schemes?: string[];
    consumes?: string[];
    produces?: string[];
    paths: { [key: string]: swaggerPath };
    components?: { [key: string]: any };
    parameters?: {
        [key: string]: swaggerParameter;
    };
    responses?: {
        [key: string]: swaggerResponse;
    };
}
