'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ShieldAlert, UserPlus } from 'lucide-react';

export default function TemporaryCredentialsDialog({
  credentials,
  onClose,
  entityLabel = 'Account'
}) {
  if (!credentials || !onClose) {
    return null;
  }

  return (
    <Dialog open={Boolean(credentials)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-xl p-0 overflow-hidden border-slate-200 shadow-xl">
        <div className="bg-white px-6 py-5 border-b border-slate-200 flex flex-col items-center">
          <div className="h-12 w-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3 border border-emerald-100">
            <UserPlus className="h-6 w-6 text-emerald-600" />
          </div>
          <DialogTitle className="text-lg font-bold text-slate-900 text-center">
            {entityLabel} Registered!
          </DialogTitle>
          <DialogDescription className="text-center text-slate-500 mt-1">
            A temporary password has been generated.
          </DialogDescription>
        </div>

        <div className="p-6 bg-slate-50">
          <div className="bg-white rounded-lg p-4 border border-slate-200 space-y-3 shadow-sm">
            <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Name</span>
              <span className="font-bold text-slate-900">{credentials.name}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Email</span>
              <span className="font-bold text-slate-900">{credentials.email}</span>
            </div>
            <div className="pt-2 text-center">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Temporary Password
              </Label>
              <div className="bg-slate-50 border border-slate-200 py-3 rounded-md font-mono text-lg font-bold tracking-widest text-slate-900 select-all">
                {credentials.password}
              </div>
            </div>
          </div>

          <div className="flex gap-2 items-center justify-center mt-4 p-3 bg-amber-50 rounded-md text-amber-800 text-xs border border-amber-200 font-medium">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>Save this password now; it will not be shown again.</span>
          </div>
        </div>

        <DialogFooter className="bg-white px-6 py-4 border-t border-slate-200 sm:justify-center">
          <Button onClick={onClose} className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white">
            I have saved the credentials
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
