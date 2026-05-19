// ─── Shared base ─────────────────────────────────────────────────────────────

/** All Express route param objects must extend Record<string, string>. */
type RouteParams = Record<string, string>;

// ─── Users ────────────────────────────────────────────────────────────────────

export interface UserParams extends RouteParams {
    userId: string;
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export interface InventoryParams extends RouteParams {
    categoryId: string;
    productId: string;
}

// ─── Sales ────────────────────────────────────────────────────────────────────

export interface SaleParams extends RouteParams {
    saleId: string;
}