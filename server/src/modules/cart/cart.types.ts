export interface CartItemResponseDTO {
    id: number;
    productId: string;
    variantId: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    product: {
        name: string;
        slug: string;
        image: string | null;
    };
    variant: {
        size: string;
        colorName: string | null;
        colorHex: string | null;
        stock: number;
    } | null;
}

export interface CartResponseDTO {
    id: number;
    items: CartItemResponseDTO[];
    itemCount: number;
    subtotal: number;
}