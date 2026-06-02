import type { MultipurposeCatalogueType } from '~/constants/multipurpose-catalog';

export interface Category {
  id: number;
  catalogue_type: MultipurposeCatalogueType | string;
  name: string;
  is_active: boolean;
}

export interface CategoryCreateBody {
  catalogue_type: MultipurposeCatalogueType;
  name: string;
}

export interface CategoryUpdateBody {
  name: string;
}
