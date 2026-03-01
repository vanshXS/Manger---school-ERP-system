'use client';

import GlobalSearch from '@/components/admin/GlobalSearch';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/axios';
import { showSuccess } from '@/lib/toastHelper';
import {
  ArrowRightCircle, BookCopy, Building, CalendarClock, ChevronDown,
  GitPullRequest, GraduationCap, History, LayoutDashboard, Loader2,
  LogOut, MoreHorizontal, Settings, Users,ClipboardList
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const NavLink = ({ href, icon: Icon, children, isCollapsed }) => {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <li>
      <Link
        href={href}
        title={isCollapsed ? children : ''}
        className={`flex items-center w-full p-3 my-1 rounded-xl transition-all duration-200 group relative ${isActive
          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
          : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-100'
          }`}
      >
        <Icon size={20} className={`flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
        <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100 ml-3'}`}>
          <span className="font-medium whitespace-nowrap text-sm">{children}</span>
        </div>
      </Link>
    </li>
  );
};

const Sidebar = ({ isCollapsed, school, handleLogout }) => {
  const schoolName = school?.name || 'School Manager';
  const initial = schoolName[0]?.toUpperCase() || 'S';

  return (
    <aside className={`bg-slate-900 border-r border-slate-800/80 h-full flex flex-col transition-all duration-300 ease-in-out shrink-0 ${isCollapsed ? 'w-[4.5rem]' : 'w-64'} shadow-lg`}>
      <div className="flex items-center h-16 px-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3 w-full overflow-hidden">
          <Avatar className="h-8 w-8 ring-2 ring-slate-700/50 shrink-0">
            <AvatarImage src={school?.logoUrl} />
            <AvatarFallback className="bg-blue-600 text-white font-bold text-xs">
              {initial}
            </AvatarFallback>
          </Avatar>
          <span className={`text-slate-100 font-semibold text-sm whitespace-nowrap transition-opacity duration-300 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100 block'}`}>
            {schoolName}
          </span>
        </div>
      </div>

      <nav className="flex-grow p-3 overflow-y-auto no-scrollbar">
        <ul className="space-y-1">
          <NavLink href="/admin/dashboard" icon={LayoutDashboard} isCollapsed={isCollapsed}>Dashboard</NavLink>

          {!isCollapsed && <p className="text-[10px] uppercase text-slate-500 font-bold mt-6 mb-2 px-3 tracking-wider">Academics</p>}
          <NavLink href="/admin/classrooms" icon={Building} isCollapsed={isCollapsed}>Classrooms</NavLink>
          <NavLink href="/admin/subjects" icon={BookCopy} isCollapsed={isCollapsed}>Subjects</NavLink>
          <NavLink href="/admin/assignments" icon={GitPullRequest} isCollapsed={isCollapsed}>Assignments</NavLink>
          <NavLink href="/admin/timetable" icon={CalendarClock} isCollapsed={isCollapsed}>Timetable</NavLink>
          <NavLink href="/admin/exams"  icon={ClipboardList} isCollapsed={isCollapsed}>Exams</NavLink>
          <NavLink href="/admin/academics" icon={ArrowRightCircle} isCollapsed={isCollapsed}>Academic Year</NavLink>

          {!isCollapsed && <p className="text-[10px] uppercase text-slate-500 font-bold mt-6 mb-2 px-3 tracking-wider">People</p>}
          <NavLink href="/admin/students" icon={GraduationCap} isCollapsed={isCollapsed}>Students</NavLink>
          <NavLink href="/admin/teachers" icon={Users} isCollapsed={isCollapsed}>Teachers</NavLink>

          {!isCollapsed && <p className="text-[10px] uppercase text-slate-500 font-bold mt-6 mb-2 px-3 tracking-wider">System</p>}
          <NavLink href="/admin/settings" icon={Settings} isCollapsed={isCollapsed}>Settings</NavLink>
        </ul>
      </nav>

      <div className="p-3 border-t border-slate-800 shrink-0">
        <button onClick={handleLogout} className={`flex items-center w-full p-3 rounded-lg text-slate-400 hover:bg-red-900/20 hover:text-red-400 transition-colors ${isCollapsed ? 'justify-center' : ''}`}>
          <LogOut size={20} className="shrink-0" />
          {!isCollapsed && <span className="ml-3 text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

const DockItem = ({ href, icon: Icon, label }) => {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link href={href} className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-lg transition-colors min-w-0 flex-1 ${isActive ? 'text-blue-600' : 'text-slate-400 active:text-slate-600'}`}>
      <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
      <span className={`text-[10px] font-medium leading-tight truncate ${isActive ? 'text-blue-600' : 'text-slate-500'}`}>{label}</span>
    </Link>
  );
};

const SheetNavItem = ({ href, icon: Icon, label, onClose }) => {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link href={href} onClick={onClose} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-100 active:bg-slate-200'}`}>
      <div className={`p-2 rounded-lg ${isActive ? 'bg-blue-100' : 'bg-slate-100'}`}>
        <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-500'} />
      </div>
      <span className="text-sm font-medium">{label}</span>
      {isActive && <div className="ml-auto h-2 w-2 rounded-full bg-blue-600" />}
    </Link>
  );
};

export default function AdminLayout({ children }) {
  const [isSidebarHovered, setSidebarHovered] = useState(false);
  const [schoolData, setSchoolData] = useState(null);
  const [adminName, setAdminName] = useState('');
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const { logout, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    showSuccess('Signed out successfully.');
  };

  useEffect(() => {
    if (isAuthenticated) {
      apiClient.get('/api/admin/profile').then(res => setAdminName(res.data?.fullName || 'Administrator'));
      apiClient.get('/api/admin/school').then(res => setSchoolData(res.data?.school ?? res.data));
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-slate-50 overflow-hidden">

        {/* DESKTOP SIDEBAR - Pushes content instead of floating */}
        <div
          className="hidden lg:block z-50 h-full shrink-0"
          onMouseEnter={() => setSidebarHovered(true)}
          onMouseLeave={() => setSidebarHovered(false)}
        >
          <Sidebar isCollapsed={!isSidebarHovered} handleLogout={handleLogout} school={schoolData} />
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden transition-all duration-300">
          <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between lg:justify-end shrink-0 shadow-sm z-10">
            <div className="flex items-center gap-3 lg:hidden">
              <Avatar className="h-8 w-8 ring-1 ring-slate-200">
                <AvatarImage src={schoolData?.logoUrl} />
                <AvatarFallback className="bg-blue-600 text-white font-bold text-[10px]">
                  {(schoolData?.name || 'S')[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold text-sm text-slate-800 truncate max-w-[140px]">
                {schoolData?.name || 'Manager'}
              </span>
            </div>

            <GlobalSearch />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 min-h-[44px] min-w-[44px] lg:min-w-0 lg:min-h-0 lg:p-1.5 touch-manipulation" aria-label="Account menu">
                  <Avatar className="h-8 w-8 ring-2 ring-slate-100">
                    <AvatarFallback className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-xs font-bold">
                      {adminName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900">{adminName}</span>
                    <span className="text-xs text-slate-500 font-normal">Administrator</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/admin/settings')} className="cursor-pointer">
                  <Settings size={16} className="mr-2 text-slate-500" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
                  <LogOut size={16} className="mr-2" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          <main className="flex-1 overflow-y-auto pb-20 lg:pb-0 scroll-smooth">
            <div className="admin-page w-full min-h-full">
              {children}
            </div>
          </main>
        </div>

        {/* MOBILE BOTTOM DOCK BAR */}
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
          <div className="bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-around px-2 py-1 max-w-lg mx-auto">
              <DockItem href="/admin/dashboard" icon={LayoutDashboard} label="Home" />
              <DockItem href="/admin/students" icon={GraduationCap} label="Students" />
              <DockItem href="/admin/teachers" icon={Users} label="Teachers" />
              <DockItem href="/admin/timetable" icon={CalendarClock} label="Timetable" />
              <button onClick={() => setIsMoreOpen(true)} className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-lg transition-colors min-w-0 flex-1 ${isMoreOpen ? 'text-blue-600' : 'text-slate-400 active:text-slate-600'}`}>
                <MoreHorizontal size={20} strokeWidth={2} />
                <span className="text-[10px] font-medium leading-tight text-slate-500">More</span>
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE "MORE" SHEET */}
        <Sheet open={isMoreOpen} onOpenChange={setIsMoreOpen}>
          <SheetContent side="bottom" className="rounded-t-3xl max-h-[80vh] px-4 pb-8 border-t border-slate-200">
            <SheetHeader className="pb-4 border-b border-slate-100">
              <SheetTitle className="text-base font-bold text-slate-800">Navigation</SheetTitle>
            </SheetHeader>
            <div className="py-3 space-y-1 overflow-y-auto no-scrollbar">
              <p className="text-[10px] uppercase text-slate-400 font-bold px-4 mb-2 tracking-wider">Academics</p>
              <SheetNavItem href="/admin/classrooms" icon={Building} label="Classrooms" onClose={() => setIsMoreOpen(false)} />
              <SheetNavItem href="/admin/subjects" icon={BookCopy} label="Subjects" onClose={() => setIsMoreOpen(false)} />
              <SheetNavItem href="/admin/assignments" icon={GitPullRequest} label="Assignments" onClose={() => setIsMoreOpen(false)} />
              <SheetNavItem href="/admin/exams" icon={ClipboardList} label="Exams" onClose={() => setIsMoreOpen(false)} />
              <SheetNavItem href="/admin/academics" icon={ArrowRightCircle} label="Academic Year" onClose={() => setIsMoreOpen(false)} />

              <p className="text-[10px] uppercase text-slate-400 font-bold px-4 mt-6 mb-2 tracking-wider">System</p>
              <SheetNavItem href="/admin/activity-logs" icon={History} label="Activity Logs" onClose={() => setIsMoreOpen(false)} />
              <SheetNavItem href="/admin/settings" icon={Settings} label="Settings" onClose={() => setIsMoreOpen(false)} />

              <div className="pt-4 border-t border-slate-100 mt-6">
                <button onClick={() => { setIsMoreOpen(false); handleLogout(); }} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors">
                  <div className="p-2 rounded-lg bg-red-100">
                    <LogOut size={18} className="text-red-600" />
                  </div>
                  <span className="text-sm font-semibold">Logout</span>
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </ProtectedRoute>
  );
}