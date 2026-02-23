

'use client';

import { AcademicYearsTab } from "@/components/admin/settings/Academic-years-tab";
import { GeneralSettingsTab } from '@/components/admin/settings/General-setting-tab';
import { SecurityTab } from "@/components/admin/settings/Security-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="h-6 w-6 text-slate-600" /> Settings
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your school preferences and security</p>
      </div>
      <Tabs defaultValue="general" className="w-full">
        {/* This is your "Top-Level Navbar" */}
        <TabsList className="grid w-full grid-cols-2 max-w-md bg-slate-100 rounded-lg p-1 border">
          <TabsTrigger value="general" className="text-base font-semibold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-md py-2.5 px-4 transition-all">
            General
          </TabsTrigger>

          <TabsTrigger value="security" className="text-base font-semibold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-md py-2.5 px-4 transition-all">
            Security
          </TabsTrigger>
        </TabsList>

        {/* Content for the "General" tab */}
        <TabsContent value="general" className="mt-6">
          <GeneralSettingsTab />
        </TabsContent>

        {/* Content for the "Academic Years" tab */}
        <TabsContent value="academic-years" className="mt-6">
          <AcademicYearsTab />
        </TabsContent>

        {/* Content for the "Security" tab */}
        <TabsContent value="security" className="mt-6">
          <SecurityTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}