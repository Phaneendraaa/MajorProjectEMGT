import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/button';
import {
  GridFour,
  CreditCard,
  Receipt,
  ChatsCircle,
  SignOut,
  Moon,
  Sun
} from '@phosphor-icons/react';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <GridFour weight="fill" /> },
    { path: '/loans', label: 'Loans', icon: <CreditCard weight="fill" /> },
    { path: '/apply', label: 'Apply', icon: <Receipt weight="fill" /> },
    { path: '/chat', label: 'AI Chat', icon: <ChatsCircle weight="fill" /> },
  ];

  return (
    <div className="min-h-screen bg-background" data-testid="dashboard-layout">
      {/* Header */}
      <header className="glass-effect sticky top-0 z-50 border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="https://static.prod-images.emergentagent.com/jobs/3d532350-4ab2-4271-a6b2-e6cc9757f4fd/images/41cfd2866828185eabb9bbe5a0d8ea17e90186b34883da31fcf4d07dc3b6a698.png"
                alt="NBFC Bank"
                className="h-10 w-10"
              />
              <h1 className="text-xl font-heading font-semibold text-primary">NBFC Bank</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                data-testid="theme-toggle-button"
              >
                {theme === 'dark' ? <Sun weight="fill" /> : <Moon weight="fill" />}
              </Button>
              <div className="text-right hidden sm:block">
                <p className="font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                data-testid="logout-button"
              >
                <SignOut className="mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-6">
          <div className="flex gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-smooth border-b-2 ${
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                  }`}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="container mx-auto px-6 py-6">
          <p className="text-center text-sm text-muted-foreground">
            © 2024 NBFC Bank. All rights reserved. | Powered by AI
          </p>
        </div>
      </footer>
    </div>
  );
};

export default DashboardLayout;