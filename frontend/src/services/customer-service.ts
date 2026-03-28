// src/services/api-service.ts
import { 
  fetchCustomers, 
  createCustomer, 
  updateCustomer, 
  softDeleteCustomer 
} from '@/api/customers';
import type { Customer, Vehicle } from '@/types';

export const customerService = {
  async getAll(): Promise<Customer[]> {
    return await fetchCustomers();
  },
  
  async create(data: Omit<Customer, 'id' | 'createdAt' | 'creditBalance'>): Promise<Customer> {
    return await createCustomer(data);
  },
  
  async update(id: string, data: Partial<Customer>): Promise<Customer> {
    return await updateCustomer(id, data);
  },
  
  async delete(id: string): Promise<Customer> {
    return await softDeleteCustomer(id);
  }
};