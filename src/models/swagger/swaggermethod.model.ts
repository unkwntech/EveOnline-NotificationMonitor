import { swaggerParameter, swaggerReference } from "./swaggerparameter.model";
import { swaggerRequestBody } from "./swaggerrequestBody.model";

export interface swaggerMethod {
    tags: string[];
    summary?: string;
    description?: string;
    operationId?: string;
    parameters?: (swaggerParameter | swaggerReference)[];
    responses?: { [key: string]: any };
    requestBody?: { [key: string]: swaggerRequestBody };
}
