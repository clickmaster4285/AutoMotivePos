import {
  fetchCategories,
  fetchCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
  type Category,
} from '@/api/category';

export const categoryService = {
  async getAll(params?: { department?: string; search?: string }): Promise<Category[]> {
    return await fetchCategories(params);
  },

  async getById(id: string): Promise<Category> {
    return await fetchCategoryById(id);
  },

  async create(data: {
    categoryName: string;
    categoryCode: string;
    description?: string;
    department: 'Men' | 'Women' | 'Kids' | 'Unisex' | 'All';
  }): Promise<Category> {
    return await createCategory(data);
  },

  async update(
    id: string,
    data: Partial<{
      categoryName: string;
      categoryCode: string;
      description: string;
      department: 'Men' | 'Women' | 'Kids' | 'Unisex' | 'All';
      status: 'ACTIVE' | 'INACTIVE';
    }>,
  ): Promise<Category> {
    return await updateCategory(id, data);
  },

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    return await deleteCategory(id);
  },

  async toggleStatus(id: string): Promise<Category> {
    return await toggleCategoryStatus(id);
  },
};