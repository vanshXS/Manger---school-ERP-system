'use client';

import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, Loader2 } from 'lucide-react';

export default function ClassroomScheduleDialog({
    isOpen,
    onOpenChange,
    classroom,
    schedule,
    isLoading
}) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <CalendarDays className="h-5 w-5 text-blue-600" /> Weekly Schedule
                    </DialogTitle>
                    <DialogDescription>
                        {classroom?.gradeLevel} – {classroom?.section}
                    </DialogDescription>
                </DialogHeader>
                <Separator />
                <ScrollArea className="max-h-[55vh] mt-2">
                    {isLoading ? (
                        <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>
                    ) : schedule.length > 0 ? (
                        <div className="space-y-2 p-1">
                            {schedule.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold uppercase text-slate-400 w-16">{item.day}</span>
                                        <div>
                                            <p className="font-semibold text-slate-800 text-sm">{item.subjectName}</p>
                                            <p className="text-xs text-slate-500">{item.teacherName}</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="font-mono text-xs">{item.startTime} – {item.endTime}</Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-slate-400 text-sm">No schedule created for this class.</div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
