import React, { useMemo } from 'react';
import { Clock, MoreHorizontal, Trash2, Edit2, User } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

// Utility: Convert HH:MM:SS to AM/PM
const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const date = new Date();
  date.setHours(parseInt(h), parseInt(m));
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

// Utility: Calculate duration for subtitle
const getDuration = (start, end) => {
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);
  const diffMins = (h2 * 60 + m2) - (h1 * 60 + m1);
  return `${diffMins} min`;
};

// Utility: Consistent coloring based on subject string
const getColorStyle = (str) => {
  const styles = [
    { border: 'border-l-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100' },
    { border: 'border-l-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-100' },
    { border: 'border-l-violet-500', bg: 'bg-violet-50', text: 'text-violet-700', badge: 'bg-violet-100' },
    { border: 'border-l-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-100' },
    { border: 'border-l-rose-500', bg: 'bg-rose-50', text: 'text-rose-700', badge: 'bg-rose-100' },
    { border: 'border-l-cyan-500', bg: 'bg-cyan-50', text: 'text-cyan-700', badge: 'bg-cyan-100' },
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return styles[Math.abs(hash) % styles.length];
};

export default function TimeTableGrid({ data, onEdit, onDelete }) {
  
  const groupedData = useMemo(() => {
    const groups = {};
    DAYS.forEach(day => groups[day] = []);
    data.forEach(item => {
      const day = item.day.toUpperCase();
      if (groups[day]) groups[day].push(item);
    });
    // Sort by time
    Object.keys(groups).forEach(day => {
      groups[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
    return groups;
  }, [data]);

  return (
    <div className="overflow-x-auto pb-4">
      <div className="min-w-[1000px] grid grid-cols-6 gap-4">
        {DAYS.map(day => (
          <div key={day} className="flex flex-col gap-3">
            {/* Column Header */}
            <div className="text-center py-3 bg-white border border-slate-200 rounded-xl shadow-sm sticky top-0 z-10">
              <span className="text-xs font-bold text-slate-500 tracking-widest">{day.substring(0,3)}</span>
            </div>

            {/* Slots Area */}
            <div className="flex flex-col gap-3 min-h-[400px]">
              {groupedData[day].length === 0 ? (
                <div className="flex-1 rounded-xl border-2 border-dashed border-slate-100 flex items-center justify-center">
                   <span className="text-slate-300 text-xs font-medium">Free</span>
                </div>
              ) : (
                groupedData[day].map(slot => {
                  const style = getColorStyle(slot.subjectName);
                  return (
                    <div 
                      key={slot.id}
                      className={`
                        relative group flex flex-col gap-2 p-3 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all
                        border-l-4 ${style.border}
                      `}
                    >
                      {/* Top Row: Time & Duration */}
                      <div className="flex justify-between items-start">
                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${style.badge} ${style.text}`}>
                          {formatTime(slot.startTime)}
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 flex items-center justify-center rounded-full hover:bg-slate-100">
                            <MoreHorizontal className="h-4 w-4 text-slate-400" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(slot)}>
                              <Edit2 className="h-3 w-3 mr-2" /> Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => onDelete(slot.id)}>
                              <Trash2 className="h-3 w-3 mr-2" /> Delete Class
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Middle: Subject */}
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm leading-tight line-clamp-2">
                          {slot.subjectName}
                        </h4>
                      </div>

                      {/* Bottom: Teacher */}
                      <div className="flex items-center gap-2 mt-auto pt-2 border-t border-slate-50">
                        <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                          {slot.teacherName.charAt(0)}
                        </div>
                        <span className="text-xs text-slate-500 truncate">{slot.teacherName}</span>
                      </div>
                      
                      {/* Hover Time Range Tooltip effect could go here */}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}