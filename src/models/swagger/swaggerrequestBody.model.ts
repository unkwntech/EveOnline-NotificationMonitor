export interface swaggerRequestBody {
    description: string;
    content: { [key: string]: { schema: { type: string } } };
    required: boolean;
}
