import { ArrowLeft, ChevronRight, GraduationCap, School, ShieldCheck, UserSquare } from 'lucide-react';
import Link from 'next/link';

const roles = [
  {
    icon: ShieldCheck,
    title: 'Admin Portal',
    description: 'For school administrators and management staff.',
    href: '/admin/auth/admin-login',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    iconBg: 'bg-blue-100',
    border: 'border-blue-200',
    hoverBorder: 'hover:border-blue-400',
    hoverShadow: 'hover:shadow-blue-100/80',
    gradient: 'from-blue-600 to-indigo-600',
  },
  {
    icon: UserSquare,
    title: 'Teacher Portal',
    description: 'For teachers to manage classes and students.',
    href: '/auth/auth/teacher-login',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    iconBg: 'bg-emerald-100',
    border: 'border-emerald-200',
    hoverBorder: 'hover:border-emerald-400',
    hoverShadow: 'hover:shadow-emerald-100/80',
    gradient: 'from-emerald-600 to-teal-600',
  },
  {
    icon: GraduationCap,
    title: 'Student Portal',
    description: 'For students to access their academic information.',
    href: '/auth/auth/student-login',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    iconBg: 'bg-orange-100',
    border: 'border-orange-200',
    hoverBorder: 'hover:border-orange-400',
    hoverShadow: 'hover:shadow-orange-100/80',
    gradient: 'from-orange-600 to-amber-600',
  },
];

export default function SelectRolePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] right-[10%] w-80 h-80 bg-blue-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-[15%] left-[5%] w-72 h-72 bg-indigo-100/25 rounded-full blur-3xl" />
        <div className="absolute top-[50%] left-[50%] w-96 h-96 bg-violet-50/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="relative w-full max-w-2xl">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors mb-8 group"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to home
        </Link>

        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center space-x-2.5 mb-6 group">
            <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-md shadow-blue-200/50 group-hover:shadow-blue-300/60 transition-shadow">
              <School className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-mono font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Manger
            </span>
          </Link>
          <h1 className="text-3xl md:text-4xl font-mono font-bold text-slate-900 tracking-tight">
            Select Your Portal
          </h1>
          <p className="mt-3 text-base text-slate-500 max-w-md mx-auto">
            Choose the portal that matches your role to access your personalized dashboard.
          </p>
        </div>

        {/* Role Cards */}
        <div className="space-y-4">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <Link
                key={role.title}
                href={role.href}
                className={`group flex items-center w-full p-5 md:p-6 bg-white/80 backdrop-blur-sm ${role.border} ${role.hoverBorder} ${role.hoverShadow} transition-all duration-300 rounded-2xl border shadow-sm hover:shadow-lg hover:-translate-y-0.5`}
              >
                <div className={`shrink-0 w-14 h-14 rounded-xl ${role.iconBg} flex items-center justify-center mr-5 group-hover:scale-105 transition-transform duration-300`}>
                  <Icon size={26} className={role.color} />
                </div>
                <div className="flex-grow min-w-0">
                  <h3 className="text-lg font-semibold text-slate-800 group-hover:text-slate-900 transition-colors">
                    {role.title}
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">{role.description}</p>
                </div>
                <div className="shrink-0 ml-4">
                  <div className={`w-9 h-9 rounded-xl ${role.bg} flex items-center justify-center group-hover:bg-gradient-to-br group-hover:${role.gradient} transition-all duration-300`}>
                    <ChevronRight className={`w-5 h-5 ${role.color} group-hover:translate-x-0.5 group-hover:text-white transition-all duration-300`} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-400 mt-8">
          Contact your administrator if you need help accessing your account.
        </p>
      </div>
    </main>
  );
}
