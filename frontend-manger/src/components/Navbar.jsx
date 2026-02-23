// components/Navbar.jsx
import Link from 'next/link';
import { School } from 'lucide-react';

export const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 w-full bg-foreground/80 backdrop-blur-sm z-50 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <School className="h-8 w-8 text-primary" />
            <span className="text-2xl font-mono font-bold text-text-primary">Manger</span>
          </Link>
          <div className="flex items-center">
            <Link
              href="/select-role"
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};