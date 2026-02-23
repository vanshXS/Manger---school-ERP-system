import Link from 'next/link';
import { ShieldCheck, UserSquare, GraduationCap, ChevronRight, School } from 'lucide-react';

// This is a self-contained "Role" item component, used only on this page.
const RoleItem = ({ icon, title, description, href }) => (
  <Link
    href={href}
    className="group flex items-center w-full p-4 md:p-6 bg-white hover:bg-slate-50 transition-colors duration-200 rounded-xl border border-slate-200"
  >
    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center mr-5">
      {icon}
    </div>
    <div className="flex-grow">
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      <p className="text-slate-600">{description}</p>
    </div>
    <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-slate-600 transition-colors" />
  </Link>
);

export default function SelectRolePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-100">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center space-x-2 mb-4">
            <div className="p-2 bg-white rounded-lg border border-slate-200">
              <School className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-xl font-mono font-bold text-slate-800">Manger</span>
          </Link>
          <h1 className="text-3xl md:text-4xl font-mono font-bold text-slate-900">
            Select Your Portal
          </h1>
          <p className="mt-2 text-md text-slate-600">
            Choose the appropriate portal to sign in to your account.
          </p>
        </div>

        <div className="space-y-4">
          <RoleItem
            icon={<ShieldCheck size={24} className="text-blue-600" />}
            title="Admin Portal"
            description="For school administrators and management staff."
            href="/admin/auth/admin-login"
          />
          <RoleItem
            icon={<UserSquare size={24} className="text-green-600" />}
            title="Teacher Portal"
            description="For teachers to manage classes and students."
            href="/auth/auth/teacher-login"
          />
          <RoleItem
            icon={<GraduationCap size={24} className="text-orange-600" />}
            title="Student Portal"
            description="For students to access their academic information."
            href="/auth/auth/student-login"
          />
        </div>
      </div>
    </main>
  );
}

