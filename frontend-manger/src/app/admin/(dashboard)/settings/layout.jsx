'use client';

import { Settings } from 'lucide-react';
import { Toaster } from "@/components/ui/sonner"; 

export default function SettingsLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Toaster placed here to ensure visibility across all settings pages */}
      <Toaster position="top-right" richColors closeButton theme="light" />

      <div className="max-w-7xl mx-auto space-y-8 p-6 md:p-8 lg:p-10">
        {/* Header */}
        <div className="flex flex-col gap-2 pb-6 border-b border-slate-200">
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3 tracking-tight">
            <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
              <Settings className="h-6 w-6 text-white" />
            </div>
            School Settings
          </h1>
          <p className="text-slate-500 ml-1">
            Manage your institution's profile, academic calendar, and security preferences.
          </p>
        </div>

        {/* Content */}
        <div className="animate-in fade-in-50 slide-in-from-bottom-5 duration-500">
          {children}
        </div>
      </div>
    </div>
  );
}