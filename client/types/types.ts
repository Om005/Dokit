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

export interface Project {
    id: string;
    isPasswordProtected: boolean;
    isArchived: boolean;
    visibility: "PUBLIC" | "PRIVATE";
    name: string;
    description: string;
    createdAt: string;
    lastAccessedAt: string;
}
