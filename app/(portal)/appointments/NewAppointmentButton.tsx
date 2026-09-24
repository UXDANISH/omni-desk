'use client';

import { useToast } from '@/components/ui/Toast';

export function NewAppointmentButton() {
  const toast = useToast();
  return (
    <button type="button" className="cf-btn-primary h-[38px]" onClick={() => toast('The booking form connects to your practice software in the next build step.')}>
      New appointment
    </button>
  );
}
