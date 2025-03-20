'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Link from 'next/link';
import UserProfile from '@/components/auth/UserProfile';
import { useAuth } from '@/app/providers/AuthProvider';

interface BaseLayoutProps {
  children: React.ReactNode;
}

export default function BaseLayout({ children }: BaseLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();
  
  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Current year as a derived value
  const currentYear = mounted ? new Date().getFullYear() : 2024;
  
  // Memoized toggle handler
  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prevState => !prevState);
  }, []);
  
  // Memoize navigation links to prevent unnecessary re-renders
  const navLinks = useMemo(() => {
    const links = [
      { href: '/', label: 'Home' }
    ];
    
    // Only add authenticated routes if user is logged in
    if (mounted && user) {
      links.push(
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/profile', label: 'Profile' }
      );
    }
    
    return links;
  }, [mounted, user]);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white shadow-sm" role="banner">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4" role="navigation" data-testid="navbar">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-800">
                My App
              </Link>
            </div>
            
            {/* Desktop menu (hidden on mobile) */}
            <div className="hidden md:flex space-x-4" data-testid="desktop-menu">
              {navLinks.map(link => (
                <Link 
                  key={link.href}
                  href={link.href} 
                  className="px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center">
              <UserProfile />

              {/* Mobile menu button (hidden on desktop) */}
              <button
                type="button"
                onClick={toggleMenu}
                className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 ml-2"
                aria-expanded={isMenuOpen}
                aria-label="Main menu"
                data-testid="mobile-menu-button"
              >
                <span className="sr-only">Open main menu</span>
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile menu (hidden on desktop) */}
          {isMenuOpen && (
            <div className="md:hidden" role="menu" data-testid="mobile-menu">
              <div className="pt-2 pb-3 space-y-1">
                {navLinks.map(link => (
                  <Link 
                    key={link.href}
                    href={link.href} 
                    role="menuitem" 
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>
      </header>

      <main className="flex-grow" data-testid="main-content">
        {children}
      </main>

      <footer className="bg-gray-100 py-6" role="contentinfo" data-testid="footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-700">
            © {currentYear} My App. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
} 