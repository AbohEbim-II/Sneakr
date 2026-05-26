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
import productRouter from "./modules/products/products.routes.js";
import brandRouter from "./modules/products/brand/brands.routes.js";
import categoryRouter from "./modules/products/category/category.routes.js";
import reviewRouter from "./modules/products/reviews/reviews.routes.js";
import variantRouter from "./modules/products/variant/variants.routes.js";



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

// Cart
app.use("/api/v1/cart", cartRouter);

// Product
app.use("/api/v1/products", productRouter);
app.use("/api/v1/product/brand", brandRouter); // brands are part of products module
app.use("/api/v1/product/category", categoryRouter); // sizes are part of products module
app.use("/api/v1/product/review", reviewRouter); // reviews are part of products module
app.use("/api/v1/product/variant", variantRouter); // variants are part of products module

// API Docs
// setupSwagger(app);

// 404 handler
app.all("{/*path}", (req: Request, res: Response, next: NextFunction) => {
    next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

app.use(errorMiddleware);

export default app;
