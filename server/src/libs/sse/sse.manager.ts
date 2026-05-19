import type { Response } from "express";
import { logger } from "@/libs/logger.js";

// ─── Event types ──────────────────────────────────────────────────────────────

export type SSEEventName =
    // Order Events
    | "order.created"
    | "order.confirmed"
    | "order.processing"
    | "order.cancelled"
    | "order.refunded"
    // Payment events
    | "payment.processing"
    | "payment.completed"
    | "payment.failed"
    // Shipment events
    | "shipment.preparing"
    | "shipment.out_for_delivery"
    | "shipment.delivered"
    | "shipment.failed"
    // Tracking events
    | "tracking.updated"
    // Product/inventory events
    | "variant.low_stock"
    | "variant.out_of_stock"
    | "review.submitted"
    // Notification events
    | "notification.new"
    | "ping"; // heartbeat to keep connections alive

export interface SSEPayload {
    event: SSEEventName;
    data: Record<string, unknown>;
    timestamp: string;
}

export interface OrderEventData {
    orderId: string;
    orderSequence: number;
    status: string;
    total: number;
}

export interface PaymentEventData {
    orderId: string;
    paymentId: string;
    status: string;
    amount: number;
    currency: string;
}

export interface ShipmentEventData {
    orderId: string;
    shipmentId: string;
    status: string;
    carrier: string;
    trackingNumber?: string;
    estimatedAt?: string;
}

export interface TrackingEventData {
    shipmentId: string;
    status: string;
    location?: string;
    occurredAt: string;
}

export interface VariantStockEventData {
    productId: string;
    variantId: string;
    productName: string;
    size: string;
    colorName?: string;
    stock: number;
}

export interface NotificationEventData {
    notificationId: string;
    type: string;
    title: string;
    body: string;
    link?: string;
}

// ─── SSE Manager ──────────────────────────────────────────────────────────────

/**
 * Singleton that tracks all active SSE connections grouped by organizationId.
 *
 * Architecture:
 *   connections: Map<orgId, Set<Response>>
 *
 * Each Response in the Set is a long-lived HTTP response configured for SSE
 * streaming. The Set is cleaned up automatically when a client disconnects.
 */
class SSEManagerClass {
    private connections = new Map<string, Set<Response>>();
    private pingInterval: NodeJS.Timeout | null = null;

    // ── Connect ──────────────────────────────────────────────────────────────

    /**
     * Register a new SSE client for an org. Sends the initial connection event
     * and sets up cleanup on disconnect.
     */
    connect(userId: string, res: Response): void {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering
        res.flushHeaders();

        if (!this.connections.has(userId)) {
            this.connections.set(userId, new Set());
        }
        this.connections.get(userId)!.add(res);

        logger.info(
            { userId, activeConnections: this.connections.get(userId)!.size },
            "SSE client connected",
        );

        this.send(res, {
            event: "ping",
            data: { message: "connected", userId },
            timestamp: new Date().toISOString(),
        });

        res.on("close", () => this.disconnect(userId, res));
    }

    // ── Disconnect ───────────────────────────────────────────────────────────

    private disconnect(userId: string, res: Response): void {
        const clients = this.connections.get(userId);
        if (!clients) return;

        clients.delete(res);

        if (clients.size === 0) {
            this.connections.delete(userId);
        }

        logger.info(
            { userId, remaining: clients.size },
            "SSE client disconnected",
        );
    }

    // ── Send to one client ───────────────────────────────────────────────────

    /**
     * Write a single SSE frame. Returns false if the connection was already
     * closed so the caller can remove it.
     */
    private send(res: Response, payload: SSEPayload): boolean {
        if (res.writableEnded) return false;

        try {
            res.write(`event: ${payload.event}\n`);
            res.write(
                `data: ${JSON.stringify({ ...payload.data, timestamp: payload.timestamp })}\n\n`,
            );
            return true;
        } catch {
            return false;
        }
    }

    // ── Broadcast to user ─────────────────────────────────────────────────────

    /**
     * Push an event to every connected client in the user.
     * Safe to call from anywhere — a no-op if no clients are connected.
     */
    broadcast(
        userId: string,
        event: SSEEventName,
        data: Record<string, unknown>,
    ): void {
        const clients = this.connections.get(userId);
        if (!clients || clients.size === 0) return;

        const payload: SSEPayload = {
            event,
            data,
            timestamp: new Date().toISOString(),
        };

        let dead = 0;
        for (const res of clients) {
            if (!this.send(res, payload)) {
                clients.delete(res);
                dead++;
            }
        }

        if (clients.size === 0) {
            this.connections.delete(userId);
        }

        if (dead > 0) {
            logger.debug({ userId, removed: dead }, "Cleaned up stale SSE connections");
        }

        logger.debug({ userId, event, clients: clients.size }, "SSE broadcast sent");
    }

    // ── Heartbeat ────────────────────────────────────────────────────────────

    /**
     * Start sending periodic ping events to all clients.
     * Prevents proxies and load balancers from closing idle connections.
     * Call once at server startup.
     */
    startHeartbeat(intervalMs = 25_000): void {
        if (this.pingInterval) return;

        this.pingInterval = setInterval(() => {
            const timestamp = new Date().toISOString();

            for (const [userId, clients] of this.connections) {
                const payload: SSEPayload = { event: "ping", data: {}, timestamp };

                for (const res of clients) {
                    if (!this.send(res, payload)) {
                        clients.delete(res);
                    }
                }

                if (clients.size === 0) {
                    this.connections.delete(userId);
                }
            }
        }, intervalMs);

        logger.info({ intervalMs }, "SSE heartbeat started");
    }

    stopHeartbeat(): void {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    // ── Stats ────────────────────────────────────────────────────────────────

    stats(): Record<string, number> {
        const result: Record<string, number> = {};
        for (const [userId, clients] of this.connections) {
            result[userId] = clients.size;
        }
        return result;
    }
}

// Export singleton
export const SSEManager = new SSEManagerClass();