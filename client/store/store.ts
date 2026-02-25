import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistedAuthReducer } from "./authentication";
import { persistedProjectReducer } from "./project";

import { FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";
import { persistStore } from "redux-persist";

const rootReducer = combineReducers({
    auth: persistedAuthReducer,
    project: persistedProjectReducer,
});

export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
