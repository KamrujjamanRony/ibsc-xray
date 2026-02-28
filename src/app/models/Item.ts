export interface ItemM {
  id?: number;
  code?: string | null;
  name: string | null;
  mainCatId?: number;
  mainCatName?: string | null;
  model?: string | null;
  unitId?: number | null;
  unitName?: string | null;
  brandId?: number | null;
  brandName?: string | null;
  purchasePrice?: number | null;
  salePrice?: number | null;
  reorderQuantity?: number | null;
  valid?: number | null;
  warrantyMonth?: number | null;
  description?: string | null;
  image1?: string | null;
  image2?: string | null;
  image3?: string | null;
  pno?: number | null;
  userName?: string | null;
  entryDate?: string | null;
}

export interface BrandM {
  id?: number;
  name: string | null;
}

export interface CategoryM {
  id?: number;
  name: string | null;
}

export interface UnitM {
  id?: number;
  name: string | null;
  valid?: number | undefined;
}