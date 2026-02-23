'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { School, BarChart, BookOpenCheck, Users, Megaphone } from 'lucide-react';

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const handleGetStarted = () => {
    setIsLoading(true);
    toast.loading('Redirecting...', { id: 'loading-toast' });

    setTimeout(() => {
      toast.dismiss('loading-toast');
      router.push('/select-role');
    }, 1500);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* --- Navbar --- */}
      <nav className="fixed top-0 left-0 w-full bg-white/90 backdrop-blur-lg z-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <div className="p-2 bg-slate-100 rounded-lg">
              <School className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-xl font-mono font-bold text-slate-800">Manger</span>
          </Link>
          <button
            onClick={handleGetStarted}
            className="px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-900 transition-colors"
          >
            Get Started
          </button>
        </div>
      </nav>

      <main className="flex-grow">
        {/* --- Hero Section --- */}
        <section className="pt-32 pb-24 text-center">
          <div className="max-w-4xl mx-auto px-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-4xl md:text-6xl font-mono font-bold text-slate-900 tracking-tight"
            >
              The Modern Command Center for Your School
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto"
            >
              Manger is a unified platform for administrators, teachers, and students. Simplify your daily operations and focus on what truly matters.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-10"
            >
              <button
                onClick={handleGetStarted}
                disabled={isLoading}
                className="px-8 py-3 bg-blue-600 text-white text-base font-semibold rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-md disabled:bg-slate-400 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Loading...' : 'Go to Portal'}
              </button>
            </motion.div>
          </div>
        </section>

        {/* --- Features Section --- */}
        <section className="py-24 bg-slate-50 border-t border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-mono font-bold text-slate-900">
                A Unified & Cohesive System
              </h2>
              <p className="mt-3 text-lg text-slate-600">
                All the tools you need, seamlessly integrated.
              </p>
            </div>
            <div className="mt-16 grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-4 text-center">
              {/* Feature Item 1 */}
              <div>
                <div className="bg-white border-2 border-slate-200 text-blue-600 w-16 h-16 rounded-lg flex items-center justify-center mx-auto">
                  <Users size={32} />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-800">User Management</h3>
                <p className="mt-1 text-slate-600">Centralized profiles for students and teachers.</p>
              </div>
              {/* Feature Item 2 */}
              <div>
                <div className="bg-white border-2 border-slate-200 text-blue-600 w-16 h-16 rounded-lg flex items-center justify-center mx-auto">
                  <BookOpenCheck size={32} />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-800">Academics</h3>
                <p className="mt-1 text-slate-600">Manage attendance, assignments, and marks.</p>
              </div>
              {/* Feature Item 3 */}
              <div>
                <div className="bg-white border-2 border-slate-200 text-blue-600 w-16 h-16 rounded-lg flex items-center justify-center mx-auto">
                  <BarChart size={32} />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-800">Results & Reports</h3>
                <p className="mt-1 text-slate-600">Generate and distribute marksheets with ease.</p>
              </div>
              {/* Feature Item 4 */}
              <div>
                <div className="bg-white border-2 border-slate-200 text-blue-600 w-16 h-16 rounded-lg flex items-center justify-center mx-auto">
                  <Megaphone size={32} />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-800">Communication</h3>
                <p className="mt-1 text-slate-600">Broadcast important announcements school-wide.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* --- Footer --- */}
      <footer className="w-full bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-slate-500">
          <p>&copy; {new Date().getFullYear()} Manger. A new standard for school management.</p>
        </div>
      </footer>
    </div>
  );
}

