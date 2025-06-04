// frontend/src/components/layout/Header.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '../../store/userStore';
import { getImageUrl } from '../../services/api';
import Button from '../ui/Button';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useUserStore();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsProfileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Helper function to generate initials for fallback avatar
  const generateInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return 'U';
    return `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase();
  };

  // Helper function to create fallback avatar
  const createFallbackAvatar = (firstName, lastName) => {
    const initials = generateInitials(firstName, lastName);
    const colors = ['3B82F6', 'EF4444', '10B981', 'F59E0B', '8B5CF6', 'EC4899'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="#${color}"/>
        <text x="50" y="50" font-family="Arial, sans-serif" font-size="36" font-weight="bold" text-anchor="middle" dy=".1em" fill="white">${initials}</text>
      </svg>
    `)}`;
  };

  // Get user avatar with fallback
  const getUserAvatar = () => {
    if (user?.profileImage) {
      return getImageUrl(user.profileImage);
    }
    if (user?.avatar) {
      return user.avatar;
    }
    return createFallbackAvatar(user?.firstName, user?.lastName);
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    if (user?.name) {
      return user.name;
    }
    return 'User';
  };

  // Navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [
      { name: 'Home', href: '/', show: true }
    ];

    if (user?.role === 'admin') {
      return [
        ...baseItems,
        { name: 'Admin Dashboard', href: '/admin', show: true },
        { name: 'Questions', href: '/admin/questions', show: true },
        { name: 'Users', href: '/admin/users', show: true },
        { name: 'Results', href: '/admin/results', show: true },
        { name: 'Settings', href: '/admin/settings', show: true }
      ];
    } else if (user) {
      return [
        ...baseItems,
        { name: 'Dashboard', href: '/dashboard', show: true },
        { name: 'Profile', href: '/profile', show: true }
      ];
    }

    return baseItems;
  };

  const navigation = getNavigationItems();

  return (
    <header className={`shadow-sm border-b ${isAdminRoute ? 'bg-gray-900 text-white' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="text-2xl">🎯</div>
              <div>
                <span className={`text-xl font-bold ${isAdminRoute ? 'text-white' : 'text-gray-900'}`}>
                  InterviewX
                </span>
                {isAdminRoute && (
                  <span className="ml-2 text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                    ADMIN
                  </span>
                )}
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => 
              item.show && (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? (isAdminRoute ? 'text-blue-300 border-b-2 border-blue-300 pb-1' : 'text-blue-600 border-b-2 border-blue-600 pb-1')
                      : (isAdminRoute ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-blue-600')
                  }`}
                >
                  {item.name}
                </Link>
              )
            )}
          </nav>

          {/* Right side - Auth buttons or User menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="relative">
                {/* User Profile Button */}
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <img
                    src={getUserAvatar()}
                    alt={getUserDisplayName()}
                    className="h-8 w-8 rounded-full object-cover"
                    onError={(e) => {
                      e.target.src = createFallbackAvatar(user?.firstName, user?.lastName);
                    }}
                  />
                  <div className="hidden md:block text-left">
                    <div className={`font-medium ${isAdminRoute ? 'text-white' : 'text-gray-700'}`}>
                      {getUserDisplayName()}
                    </div>
                    {user.role && (
                      <div className={`text-xs ${isAdminRoute ? 'text-gray-300' : 'text-gray-500'}`}>
                        {user.role}
                      </div>
                    )}
                  </div>
                  <svg
                    className={`h-4 w-4 transition-transform ${
                      isProfileMenuOpen ? 'rotate-180' : ''
                    } ${isAdminRoute ? 'text-gray-300' : 'text-gray-500'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-gray-500 border-b">
                        <div className="font-medium text-gray-900">{getUserDisplayName()}</div>
                        <div className="text-xs">{user.email}</div>
                        {user.role && (
                          <div className="text-xs text-blue-600 capitalize">{user.role}</div>
                        )}
                      </div>
                      
                      {/* Role-specific menu items */}
                      {user.role === 'admin' ? (
                        <>
                          <Link
                            to="/admin"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            👑 Admin Dashboard
                          </Link>
                          <Link
                            to="/admin/users"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            👥 Manage Users
                          </Link>
                          <Link
                            to="/admin/questions"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            ❓ Manage Questions
                          </Link>
                          <Link
                            to="/admin/results"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            📊 View Results
                          </Link>
                          <Link
                            to="/admin/settings"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            ⚙️ System Settings
                          </Link>
                          <div className="border-t">
                            <Link
                              to="/dashboard"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => setIsProfileMenuOpen(false)}
                            >
                              📱 User Dashboard
                            </Link>
                          </div>
                        </>
                      ) : (
                        <>
                          <Link
                            to="/dashboard"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            📊 Dashboard
                          </Link>
                        </>
                      )}
                      
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        👤 Profile Settings
                      </Link>
                      
                      <div className="border-t">
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                        >
                          🚪 Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`md:hidden inline-flex items-center justify-center p-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ${
                isAdminRoute 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                  : 'text-gray-400 hover:text-gray-500 hover:bg-gray-100'
              }`}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className={`md:hidden border-t ${isAdminRoute ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="pt-2 pb-3 space-y-1">
              {navigation.map((item) => 
                item.show && (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`block px-3 py-2 text-base font-medium ${
                      isActive(item.href)
                        ? (isAdminRoute ? 'text-blue-300 bg-gray-800' : 'text-blue-600 bg-blue-50')
                        : (isAdminRoute ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50')
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                )
              )}
              
              {!user && (
                <div className="px-3 py-2 space-y-2">
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Overlay for profile menu */}
      {isProfileMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsProfileMenuOpen(false)}
        />
      )}
    </header>
  );
};

export default Header;