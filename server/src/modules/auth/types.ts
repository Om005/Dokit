namespace types {
    export interface cookieOptions {
        httpOnly: boolean;
        secure: boolean;
        sameSite: "lax" | "strict" | "none";
    }
}

export default types;
