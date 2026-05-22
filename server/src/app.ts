import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { httpLogger } from "./middleware/logger.middleware.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { AppError } from "./utils/appError.js";
// import { setupSwagger } from "./docs/swagger.setup.js";

// Routers
import authRouter from "./modules/auth/auth.routes.js";
import cartRouter from "./modules/cart/cart.routes.js";



const app = express();

app.use(helmet());

app.use(
    cors({
        origin: "http://localhost:5000", // your frontend URL
        credentials: true,
    }),
);

app.use(express.json());
// app.use(cookieParser());
app.use(httpLogger);

// Health check
app.get("/health", (_, res) => {
    res.json({ status: "OK", uptime: process.uptime() });
});

// Auth (public)
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/cart", cartRouter);

// System Level actions
// app.use("/api/v1/sys", sysUsersRouter);

// Org Level Actions
// app.use("/api/v1/orgs/:orgSlug/users", orgUsersRouter);
// app.use("/api/v1/orgs/:orgSlug/inventory", inventoryRouter);
// app.use("/api/v1/orgs/:orgSlug/sales", salesRouter);
// app.use("/api/v1/orgs/:orgSlug/events", sseRouter);

// API Docs
// setupSwagger(app);

// 404 handler
app.all("{/*path}", (req: Request, res: Response, next: NextFunction) => {
    next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

app.use(errorMiddleware);

export default app;
