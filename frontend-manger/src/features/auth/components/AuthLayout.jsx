'use client';

import Link from 'next/link';
import * as LucideIcons from 'lucide-react';

const colorClasses = {
  blue: {
    bgGradient: 'from-blue-50 to-slate-100',
    iconText: 'text-blue-600',
  },
  orange: {
    bgGradient: 'from-orange-50 to-slate-100',
    iconText: 'text-orange-600',
  },
};

export default function AuthLayout({ iconName, title, subtitle, accentColor, children }) {
  const Icon = LucideIcons[iconName] || LucideIcons.School;
  const classes = colorClasses[accentColor] || colorClasses.blue;

  return (
    <main className={`flex min-h-screen flex-col items-center justify-center px-4 bg-gradient-to-b ${classes.bgGradient}`}>
      <div className="w-full max-w-md">
        {/* Branding Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-4">
            <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
              <Icon className={`h-6 w-6 ${classes.iconText}`} />
            </div>
            <span className="text-xl font-mono font-bold text-slate-800">
              Manger
            </span>
          </Link>
          <h1 className="text-3xl font-mono font-bold text-slate-900">
            {title}
          </h1>
          <p className="text-slate-600 mt-1 text-sm">
            {subtitle}
          </p>
        </div>

        {/* Card Body */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 transition-all duration-200 hover:shadow-2xl">
          {children}
        </div>
      </div>
    </main>
  );
}
