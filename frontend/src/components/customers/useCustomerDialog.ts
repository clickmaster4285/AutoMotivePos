// src/hooks/useCustomerDialog.ts
import { useState } from 'react';
import type { Customer } from '@/types';

export function useCustomerDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);

  const openCreateDialog = () => {
    setEditingCustomer(null);
    setIsOpen(true);
  };

  const openEditDialog = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsOpen(true);
  };

  const openViewDialog = (customer: Customer) => {
    setViewingCustomer(customer);
  };

  const closeDialog = () => {
    setIsOpen(false);
    setEditingCustomer(null);
  };

  const closeViewDialog = () => {
    setViewingCustomer(null);
  };

  return {
    isOpen,
    editingCustomer,
    viewingCustomer,
    openCreateDialog,
    openEditDialog,
    openViewDialog,
    closeDialog,
    closeViewDialog,
  };
}