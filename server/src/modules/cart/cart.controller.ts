import type { Request, Response, NextFunction } from "express";
import { CartService } from "./cart.service.js";

export class CartController {
    static getCart = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const cart = await CartService.getCart(req.user!.id);
            res.json({ status: "success", data: cart });
        } catch (err) {
            next(err);
        }
    };

    static addItem = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const cart = await CartService.addItem(req.user!.id, req.body);
            res.status(201).json({ status: "success", data: cart });
        } catch (err) {
            next(err);
        }
    };

    static updateItem = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const cart = await CartService.updateItem(
                req.user!.id,
                Number(req.params.itemId),
                req.body,
            );
            res.json({ status: "success", data: cart });
        } catch (err) {
            next(err);
        }
    };

    static removeItem = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const cart = await CartService.removeItem(
                req.user!.id,
                Number(req.params.itemId),
            );
            res.json({ status: "success", data: cart });
        } catch (err) {
            next(err);
        }
    };

    static clearCart = async (req: Request, res: Response, next: NextFunction) => {
        try {
            await CartService.clearCart(req.user!.id);
            res.json({ status: "success", message: "Cart cleared" });
        } catch (err) {
            next(err);
        }
    };
}