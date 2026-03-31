import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, Phone, Calendar, CheckCircle2, XCircle } from 'lucide-react';

export default function TeacherProfileHeader({ teacher }) {
  
  // Safe initals generator
  const getInitials = (first, last) => {
    return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Helper for image URL (Replace localhost with env variable in real app)
  const getImageUrl = (url) => {
    if (!url) return '';
    // If it's already a full URL, return it
    if (url.startsWith('http')) return url;
    // Otherwise append to API base
    return url;
  };

  return (
    <Card className="border-0 shadow-sm ring-1 ring-slate-200 overflow-hidden bg-white">
      <div className="p-8">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center">
          
          {/* Avatar */}
          <div className="shrink-0">
            <Avatar className="h-28 w-28 ring-1 ring-slate-100 shadow-md">
                <AvatarImage
                  src={getImageUrl(teacher.profilePictureUrl)}
                  alt={`${teacher.firstName} ${teacher.lastName}`}
                  className="object-cover"
                />
                <AvatarFallback className="text-3xl font-bold bg-indigo-50 text-indigo-600">
                  {getInitials(teacher.firstName, teacher.lastName)}
                </AvatarFallback>
            </Avatar>
          </div>

          {/* Teacher Info */}
          <div className="flex-1 space-y-2 w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div>
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                    {teacher.firstName} {teacher.lastName}
                  </h1>
                  
                  <div className="flex items-center gap-3 mt-2">
                      <Badge variant="secondary" className="px-2.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200">
                          ID: {teacher.id}
                      </Badge>
                      <span className="text-slate-300">|</span>
                      
                      {/* Active Status Badge */}
                      {teacher.active ? (
                        <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                             <CheckCircle2 className="h-3.5 w-3.5" /> Active Faculty
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                             <XCircle className="h-3.5 w-3.5" /> Inactive
                        </div>
                      )}
                  </div>
               </div>
            </div>

            {/* Contact Chips */}
            <div className="flex flex-wrap gap-3 pt-3">
               <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  {teacher.email}
               </div>

               <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  {teacher.phoneNumber || 'No phone provided'}
               </div>

               <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  Joined {formatDate(teacher.joinDate)}
               </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}