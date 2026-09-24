'use client';

import { useToast } from '@/components/ui/Toast';

export function AddPatientButton({ label = 'Add patient', message = 'New patients sync from your practice software.' }: { label?: string; message?: string }) {
  const toast = useToast();
  return <button type="button" className="cf-btn-primary h-[38px]" onClick={() => toast(message)}>{label}</button>;
}
