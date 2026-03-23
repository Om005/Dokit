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
    name: string;
    description?: string;
    stack: string;
    visibility: "PUBLIC" | "PRIVATE";
    isPasswordProtected: boolean;
    createdAt: string;
    updatedAt: string;
    lastAccessedAt: string;
    isOwner: boolean;
    ownerId: string;
    ownerUsername: string;
    members: {
        userId: string;
        username: string;
        accessLevel: string;
    }[];
    currentUserAccess: "READ" | "WRITE" | "OWNER";
}
export interface FileNode {
    path: string;
    name: string;
    type: "file" | "directory";
    children: string[];
    isExpanded: boolean;
    isLoaded: boolean;
}

export interface FileSystemEvent {
    action: "CREATE" | "DELETE";
    path?: string;
    isDir: boolean;
    fromPath?: string;
    toPath?: string;
}

export interface TreeNode {
    name: string;
    path: string;
    isDir: boolean;
}
