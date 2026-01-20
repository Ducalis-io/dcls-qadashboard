'use client';

import { DashboardProvider } from '@/contexts/DashboardContext';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return <DashboardProvider>{children}</DashboardProvider>;
}
