'use client';

import { useAuth } from '../contexts/AuthContext';
import GlobalNavigation from './GlobalNavigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // Don't show navigation on login page or when loading
  if (isLoading || !isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalNavigation />
      
      {/* Main content with responsive margin for navigation */}
      <div className="transition-all duration-300 ml-16 lg:ml-20">
        {children}
      </div>
    </div>
  );
}
