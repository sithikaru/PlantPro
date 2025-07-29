'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from './ui/button';
import { 
  BarChart3,
  Scan,
  Leaf,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Home,
  Activity,
  Plus,
  Edit3,
  Eye,
  History,
  UserCheck,
  Shield,
  Database
} from 'lucide-react';

interface NavigationItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  roles?: string[];
  active?: boolean;
  description?: string;
}

export default function GlobalNavigation() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Auto-collapse on mobile when navigating
  useEffect(() => {
    setIsExpanded(false);
  }, [pathname]);

  const getNavigationItems = (): NavigationItem[] => {
    const baseItems: NavigationItem[] = [
      {
        icon: Home,
        label: 'Dashboard',
        href: '/dashboard',
        description: 'Overview and analytics'
      },
      {
        icon: Scan,
        label: 'QR Scanner',
        href: '/qr-scanner',
        description: 'Scan plant lot QR codes'
      },
      {
        icon: Leaf,
        label: 'Plant Lots',
        href: '/plant-lots',
        description: 'Manage plant lots'
      }
    ];

    // Add role-specific items
    if (user?.role === 'manager') {
      baseItems.push(
        {
          icon: Users,
          label: 'User Management',
          href: '/users',
          roles: ['manager'],
          description: 'Manage users and roles'
        },
        {
          icon: Database,
          label: 'Species & Zones',
          href: '/species-zones',
          roles: ['manager'],
          description: 'Configure plant species and zones'
        }
      );
    }

    if (user?.role === 'analytics') {
      baseItems.push({
        icon: BarChart3,
        label: 'Analytics',
        href: '/analytics',
        roles: ['analytics'],
        description: 'Advanced reporting and insights'
      });
    }

    // Add context-specific items based on current page
    const contextItems = getContextualItems();
    
    return [...baseItems, ...contextItems].map(item => ({
      ...item,
      active: pathname === item.href || pathname.startsWith(item.href + '/')
    }));
  };

  const getContextualItems = (): NavigationItem[] => {
    const contextItems: NavigationItem[] = [];

    // Plant lot specific pages
    if (pathname.includes('/plant-lots/') && !pathname.endsWith('/plant-lots')) {
      const isCreatePage = pathname.includes('/create');
      const isEditPage = pathname.includes('/edit');
      const isDetailPage = pathname.match(/\/plant-lots\/\d+$/) !== null;

      if (isDetailPage) {
        contextItems.push(
          {
            icon: Edit3,
            label: 'Edit Lot',
            href: pathname + '/edit',
            roles: ['manager', 'field_staff'],
            description: 'Edit plant lot details'
          },
          {
            icon: Plus,
            label: 'Add Health Log',
            href: pathname + '/health-log/create',
            description: 'Add new health log entry'
          }
        );
      }

      if (!isCreatePage && (user?.role === 'manager' || user?.role === 'field_staff')) {
        contextItems.push({
          icon: Plus,
          label: 'New Plant Lot',
          href: '/plant-lots/create',
          roles: ['manager', 'field_staff'],
          description: 'Create new plant lot'
        });
      }
    }

    return contextItems.filter(item => 
      !item.roles || item.roles.includes(user?.role || '')
    );
  };

  const handleLogout = () => {
    logout();
    setIsExpanded(false);
  };

  const navigationItems = getNavigationItems();

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="fixed top-4 left-4 z-50 lg:hidden">
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          size="icon"
          className="rounded-full bg-white/80 backdrop-blur-md shadow-lg hover:shadow-xl border border-white/20 hover:bg-white/90 transition-all duration-300"
        >
          {isExpanded ? (
            <X className="h-5 w-5 text-gray-700" />
          ) : (
            <Menu className="h-5 w-5 text-gray-700" />
          )}
        </Button>
      </div>

      {/* Navigation Panel */}
      <div
        className={`fixed left-0 top-0 h-full z-40 transition-all duration-500 ease-out ${
          isExpanded ? 'w-80' : 'w-16 lg:w-20'
        }`}
      >
        {/* Backdrop Blur Panel */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/90 to-white/95 backdrop-blur-xl border-r border-white/20 shadow-2xl">
          {/* Animated liquid gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-green-50/50 opacity-60"></div>
          
          {/* Glass effect highlight */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/40 to-transparent"></div>
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col p-4">
          {/* Logo/Brand Section */}
          <div className={`mb-8 transition-all duration-300 ${isExpanded ? 'mt-0' : 'mt-12 lg:mt-4'}`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <Leaf className="h-6 w-6 text-white" />
              </div>
              {isExpanded && (
                <div className="animate-in slide-in-from-left-5 duration-300">
                  <h2 className="text-xl font-bold text-gray-900">PlantPro</h2>
                  <p className="text-xs text-gray-600">Plantation Manager</p>
                </div>
              )}
            </div>
          </div>

          {/* User Info */}
          {isExpanded && user && (
            <div className="mb-6 p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/30 shadow-sm animate-in slide-in-from-left-5 duration-300">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <div className="flex items-center space-x-1">
                    {user.role === 'manager' && <Shield className="h-3 w-3 text-purple-600" />}
                    {user.role === 'field_staff' && <UserCheck className="h-3 w-3 text-blue-600" />}
                    {user.role === 'analytics' && <BarChart3 className="h-3 w-3 text-green-600" />}
                    <span className="text-xs text-gray-600 capitalize">{user.role?.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <nav className="flex-1 space-y-2">
            {navigationItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = item.active;
              const isHovered = hoveredItem === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onMouseEnter={() => setHoveredItem(item.href)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`group relative flex items-center transition-all duration-300 ${
                    isExpanded ? 'p-3' : 'p-3 justify-center'
                  } rounded-2xl ${
                    isActive
                      ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-700 shadow-lg shadow-green-500/20'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/60 hover:shadow-lg'
                  }`}
                  style={{
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-green-500 to-emerald-600 rounded-r-full"></div>
                  )}

                  {/* Icon */}
                  <div className={`flex items-center justify-center transition-all duration-300 ${
                    isActive ? 'scale-110' : 'group-hover:scale-105'
                  }`}>
                    <Icon className={`h-5 w-5 ${isActive ? 'text-green-600' : ''}`} />
                  </div>

                  {/* Label and Description */}
                  {isExpanded && (
                    <div className="ml-3 flex-1 animate-in slide-in-from-left-5 duration-300">
                      <div className="flex items-center justify-between">
                        <span className={`font-medium text-sm ${
                          isActive ? 'text-green-700' : ''
                        }`}>
                          {item.label}
                        </span>
                        <ChevronRight className={`h-4 w-4 transition-all duration-300 ${
                          isHovered ? 'translate-x-1 opacity-100' : 'opacity-0'
                        }`} />
                      </div>
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Tooltip for collapsed state */}
                  {!isExpanded && (
                    <div className="absolute left-16 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900/90 backdrop-blur-sm text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50">
                      {item.label}
                      {item.description && (
                        <div className="text-xs text-gray-300 mt-1">
                          {item.description}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Liquid animation effect */}
                  <div className={`absolute inset-0 rounded-2xl transition-all duration-500 ${
                    isHovered && !isActive 
                      ? 'bg-gradient-to-r from-blue-50/50 to-purple-50/50 backdrop-blur-sm' 
                      : ''
                  }`}></div>
                </Link>
              );
            })}
          </nav>

          {/* Settings and Logout */}
          <div className="space-y-2 pt-4 border-t border-white/30">
            <Link
              href="/settings"
              className={`group relative flex items-center transition-all duration-300 ${
                isExpanded ? 'p-3' : 'p-3 justify-center'
              } rounded-2xl text-gray-600 hover:text-gray-900 hover:bg-white/60 hover:shadow-lg`}
            >
              <Settings className="h-5 w-5" />
              {isExpanded && (
                <span className="ml-3 font-medium text-sm animate-in slide-in-from-left-5 duration-300">
                  Settings
                </span>
              )}
              {!isExpanded && (
                <div className="absolute left-16 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900/90 backdrop-blur-sm text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50">
                  Settings
                </div>
              )}
            </Link>

            <button
              onClick={handleLogout}
              className={`group relative flex items-center w-full transition-all duration-300 ${
                isExpanded ? 'p-3' : 'p-3 justify-center'
              } rounded-2xl text-red-600 hover:text-red-700 hover:bg-red-50/60 hover:shadow-lg`}
            >
              <LogOut className="h-5 w-5" />
              {isExpanded && (
                <span className="ml-3 font-medium text-sm animate-in slide-in-from-left-5 duration-300">
                  Logout
                </span>
              )}
              {!isExpanded && (
                <div className="absolute left-16 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900/90 backdrop-blur-sm text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50">
                  Logout
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </>
  );
}
