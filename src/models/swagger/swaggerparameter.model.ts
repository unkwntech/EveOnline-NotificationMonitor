export interface swaggerParameter {
    description: string;
    type?: string;
    minimum?: number;
    maximum?: number;
    default?: number;
    name: string;
    in: "path" | "body" | "query";
    required?: boolean;
    schema?: any;
    items?: { [key: string]: string };
}

export interface swaggerReference {
    $ref: string;
}
