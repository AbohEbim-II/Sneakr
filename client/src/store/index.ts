import { configureStore } from "@reduxjs/toolkit";
// import authReducer from "../features/auth/authSlice";

// Create store
export const store = configureStore({
  reducer: {
    // auth: authReducer,
  },
});

// ✅ Infer the `RootState` type from the store
export type RootState = ReturnType<typeof store.getState>;

// ✅ Infer the `AppDispatch` type
export type AppDispatch = typeof store.dispatch;