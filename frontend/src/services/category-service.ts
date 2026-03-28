import { 
  fetchCategories,
  fetchCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus
} from '@/api/category';
import type { Category } from '@/types';

// Map function to convert API response to Category type
const mapToCategory = (item: any): Category => ({
  id: item._id,
  name: item.categoryName,
  code: item.categoryCode,
  description: item.description,
  department: item.department,
  status: item.status,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

export const categoryService = {
  async getAll(params?: { department?: string; search?: string }): Promise<Category[]> {
    const data = await fetchCategories(params);
    return data.map(mapToCategory);
  },
  
  async getById(id: string): Promise<Category> {
    const data = await fetchCategoryById(id);
    return mapToCategory(data);
  },
  
  async create(data: { 
    categoryName: string; 
    categoryCode: string; 
    description?: string; 
    department: "Men" | "Women" | "Kids" | "Unisex" | "All" 
  }): Promise<Category> {
    const result = await createCategory(data);
    return mapToCategory(result);
  },
  
  async update(id: string, data: Partial<{
    categoryName: string;
    categoryCode: string;
    description: string;
    department: "Men" | "Women" | "Kids" | "Unisex" | "All";
    status: "ACTIVE" | "INACTIVE";
  }>): Promise<Category> {
    const result = await updateCategory(id, data);
    return mapToCategory(result);
  },
  
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    return await deleteCategory(id);
  },
  
  async toggleStatus(id: string): Promise<Category> {
    const result = await toggleCategoryStatus(id);
    return mapToCategory(result);
  }
};