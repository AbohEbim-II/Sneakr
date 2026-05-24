export interface BrandDTO {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
}

export interface CategoryDTO {
    id: string;
    name: string;
    slug: string;
}

export interface ProductImageDTO {
    id: string;
    url: string;
    altText: string | null;
    position: number;
}

export interface VariantDTO {
    id: string;
    size: string;
    colorName: string | null;
    colorHex: string | null;
    stock: number;
    sku: string | null;
}

export interface ProductSummaryDTO {
    id: string;
    name: string;
    slug: string;
    price: number;
    averageRating: number | null;
    image: string | null;
    brand: BrandDTO;
    category: CategoryDTO;
}

export interface ProductDetailDTO extends ProductSummaryDTO {
    description: string | null;
    sku: string | null;
    images: ProductImageDTO[];
    variants: VariantDTO[];
}

export interface ReviewDTO {
    id: string;
    userId: string;
    rating: number;
    title: string | null;
    body: string | null;
    isVerifiedPurchase: boolean;
    createdAt: Date;
}

export interface PaginatedDTO<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}