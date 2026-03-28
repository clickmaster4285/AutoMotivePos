'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Landmark, Building2, Hash, Globe, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateUser } from '@/api/users.api';

const BankDetailsModal = ({ isOpen, onClose, user, onSuccess }) => {

    const updateUserMutation = useUpdateUser();

    const [formData, setFormData] = useState({
        bankName: user?.salary?.bankDetails?.bankName || '',
        accountNumber: user?.salary?.bankDetails?.accountNumber || '',
        iban: user?.salary?.bankDetails?.iban || '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        // Validate required fields
        if (!formData.bankName || !formData.accountNumber) {
            toast.error('Bank name and account number are required');
            return;
        }

        setIsSubmitting(true);

        try {
            // Show loading toast
            const loadingToast = toast.loading('Updating bank details...');

            // Call the mutation with the correct structure
            await updateUserMutation.mutateAsync({
                id: user._id,  // This goes to the URL
                userData: {     // This goes to the request body
                    salary: {
                        ...user.salary,
                        bankDetails: {
                            bankName: formData.bankName,
                            accountNumber: formData.accountNumber,
                            iban: formData.iban || '',
                        }
                    }
                }
            });

            // Dismiss loading toast and show success
            toast.dismiss(loadingToast);
            toast.success('Bank details updated successfully');

            onSuccess?.();
            onClose();
        } catch (error) {
            toast.error(error.message || 'Failed to update bank details');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Landmark className="h-5 w-5 text-primary" />
                        Bank Details - {user?.firstName} {user?.lastName}
                    </DialogTitle>
                    <p className="text-xs text-muted-foreground">
                        Employee ID: {user?.userId}
                    </p>
                </DialogHeader>

                <div className="grid gap-5 py-4">
                    {/* Current Payment Method Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                        <div className="text-xs text-blue-700">
                            <span className="font-bold">Current Payment Method:</span>{' '}
                            {user?.salary?.paymentMethod || 'Not set'} |{' '}
                            <span className="font-bold">Base Salary:</span> ${user?.salary?.baseAmount?.toLocaleString()}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Bank Name */}
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                Bank Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                placeholder="e.g., Chase, Bank of America"
                                value={formData.bankName}
                                onChange={(e) => handleChange('bankName', e.target.value)}
                                className="bg-white"
                            />
                        </div>

                        {/* Account Number */}
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold flex items-center gap-1.5">
                                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                                Account Number <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                placeholder="Enter account number"
                                value={formData.accountNumber}
                                onChange={(e) => handleChange('accountNumber', e.target.value)}
                                className="bg-white font-mono"
                            />
                        </div>

                        {/* IBAN */}
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold flex items-center gap-1.5">
                                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                                IBAN <span className="text-muted-foreground text-[10px]">(Optional)</span>
                            </Label>
                            <Input
                                placeholder="International Bank Account Number"
                                value={formData.iban}
                                onChange={(e) => handleChange('iban', e.target.value)}
                                className="bg-white font-mono text-xs"
                            />
                        </div>
                    </div>

                    {/* Preview */}
                    {formData.bankName && formData.accountNumber && (
                        <div className="p-3 bg-gray-50 rounded-lg border">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Preview</p>
                            <p className="text-xs font-medium">{formData.bankName}</p>
                            <p className="text-xs text-muted-foreground">
                                Account: •••• {formData.accountNumber.slice(-4)}
                            </p>
                            {formData.iban && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    IBAN: {formData.iban.slice(0, 4)}••••{formData.iban.slice(-4)}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-primary"
                    >
                        {isSubmitting ? 'Saving...' : 'Save Bank Details'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default BankDetailsModal;