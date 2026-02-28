export interface ApiResponse {
    success: boolean;
    statusCode: number;
    message: string;
    [data: string]: unknown;
}

export interface Payload<T> {
    success: boolean;
    statusCode: number;
    message: string;
    data?: T;
}
