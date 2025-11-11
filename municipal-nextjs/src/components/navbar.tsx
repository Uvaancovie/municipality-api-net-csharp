'use client';

import { useState } from 'react';
import { Building2, Menu, X, Calendar, FileText, AlertCircle, Plus, Home, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface NavBarProps {
  currentView?: string;
  onNavigate?: (view: string) => void;
}

export function NavBar({ currentView = 'menu', onNavigate }: NavBarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const navItems = [
    { id: 'menu', label: 'Home', icon: Home },
    { id: 'events-page', label: 'Local Events', icon: Calendar },
    { id: 'report', label: 'Report Issue', icon: AlertCircle },
    { id: 'status', label: 'Track Issues', icon: FileText },
    { id: 'create-event', label: 'Create Event', icon: Plus },
  ];

  const handleNavClick = (viewId: string) => {
    setMobileMenuOpen(false);
    if (onNavigate) {
      onNavigate(viewId);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div 
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => handleNavClick('menu')}
          >
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900">eThekwini Municipal Services</h1>
              <p className="text-xs text-gray-600">Building a better Durban together</p>
            </div>
            <div className="sm:hidden">
              <h1 className="text-lg font-bold text-gray-900">eThekwini</h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <Button
                  key={item.id}
                  variant={isActive ? 'default' : 'ghost'}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 ${
                    isActive 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              );
            })}
            <Button
              variant="ghost"
              onClick={() => router.push('/admin/login')}
              className="flex items-center gap-2 text-gray-700 hover:bg-gray-100 ml-2"
            >
              <Shield className="h-4 w-4" />
              <span>Admin</span>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
