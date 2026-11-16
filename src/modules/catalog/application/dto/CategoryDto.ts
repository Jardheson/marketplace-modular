export interface CreateCategoryInput {
  name: string;
  description: string;
}

export interface CategoryOutput {
  id: string;
  name: string;
  description: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
