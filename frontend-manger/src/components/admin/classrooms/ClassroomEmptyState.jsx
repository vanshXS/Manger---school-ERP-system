'use client';

import { Button } from '@/components/ui/button';
import { Building2, PlusCircle } from 'lucide-react';

export default function ClassroomEmptyState({ currentTab, onAddClick }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
            <Building2 className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-base font-medium text-slate-600">
                {currentTab === 'active' ? 'No active classrooms' : 'No archived classrooms'}
            </p>
            <p className="text-sm text-slate-400 mt-1">
                {currentTab === 'active' ? 'Create your first classroom to get started.' : 'Archived classrooms will appear here.'}
            </p>
            {currentTab === 'active' && (
                <Button className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={onAddClick}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Create Classroom
                </Button>
            )}
        </div>
    );
}
