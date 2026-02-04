import { AsyncThunkPayloadCreator } from "@reduxjs/toolkit";
import { AxiosError } from "axios";
import api from "./api";
import { ApiResponse } from "@/types/types";

interface ThunkApiConfig {
    rejectValue: ApiResponse;
}

const createApiHandler = <InputType>(
    url: string,
    method: "post" | "put" | "patch" | "delete" | "get" = "post"
): AsyncThunkPayloadCreator<ApiResponse, InputType, ThunkApiConfig> => {
    return async (inputData, { rejectWithValue }) => {
        try {
            const response = await api.request<ApiResponse>({
                url,
                method,
                params: method === "get" ? inputData : undefined,
                data: method !== "get" ? inputData : undefined,
            });

            console.log("API Response:", response.data);
            return response.data;
        } catch (error) {
            const err = error as AxiosError<ApiResponse>;
            console.error("API Error:", error.response);
            if (err.response && err.response.data) {
                return rejectWithValue(err.response.data);
            }

            return rejectWithValue({
                success: false,
                statusCode: 500,
                message: "An unexpected error occurred. Please try again later.",
            });
        }
    };
};

export default createApiHandler;
