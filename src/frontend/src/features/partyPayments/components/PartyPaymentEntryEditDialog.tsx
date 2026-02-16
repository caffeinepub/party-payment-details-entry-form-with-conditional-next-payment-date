import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PartyPaymentEntryForm } from '../PartyPaymentEntryForm';
import type { PartyPaymentEntry } from '../types';

interface PartyPaymentEntryEditDialogProps {
  entry: PartyPaymentEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PartyPaymentEntryEditDialog({
  entry,
  open,
  onOpenChange,
}: PartyPaymentEntryEditDialogProps) {
  const handleSuccess = () => {
    setTimeout(() => {
      onOpenChange(false);
    }, 1500);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  if (!entry) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Payment Entry</DialogTitle>
          <DialogDescription>
            Update the payment details for {entry.partyName}
          </DialogDescription>
        </DialogHeader>
        <PartyPaymentEntryForm
          mode="edit"
          initialData={entry}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
