export declare const ERROR: unique symbol;
interface MongooseError extends Error {
    code?: number;
    path?: string;
    value?: any;
    errors?: Record<string, any>;
}
export declare const errorHandler: (error: MongooseError) => Promise<never>;
export {};
//# sourceMappingURL=error-handler.d.ts.map