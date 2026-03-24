'use client';

import { motion, useInView } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  BookOpen,
  BookOpenCheck,
  Calendar,
  ChevronRight,
  ClipboardList,
  Clock,
  Code2,
  Globe,
  GraduationCap,
  Heart,
  Layers,
  Lock,
  School,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  UserSquare,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

/* ═══════════════════════════════════════════════════════════════════
   ANIMATION VARIANTS
═══════════════════════════════════════════════════════════════════ */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const staggerSlow = {
  visible: { transition: { staggerChildren: 0.15 } },
};

/* ═══════════════════════════════════════════════════════════════════
   REUSABLE SECTION WRAPPER WITH SCROLL ANIMATION
═══════════════════════════════════════════════════════════════════ */
function AnimatedSection({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={fadeUp}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ANIMATED COUNTER
═══════════════════════════════════════════════════════════════════ */
function AnimatedCounter({ value, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    const num = parseInt(value);
    if (isNaN(num)) { setCount(value); return; }
    let current = 0;
    const step = Math.max(1, Math.floor(num / 30));
    const timer = setInterval(() => {
      current += step;
      if (current >= num) { setCount(num); clearInterval(timer); }
      else setCount(current);
    }, 40);
    return () => clearInterval(timer);
  }, [isInView, value]);

  return <span ref={ref}>{count}{suffix}</span>;
}

/* ═══════════════════════════════════════════════════════════════════
   FEATURE DATA
═══════════════════════════════════════════════════════════════════ */
const FEATURES = [
  {
    icon: Users,
    title: 'Student & Teacher Management',
    desc: 'Centralized profiles with personal details, academic records, and role-based access for every member of your institution.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
  },
  {
    icon: ClipboardList,
    title: 'Exam & Results',
    desc: 'Schedule exams, track completion status, and manage marks with an intuitive exam lifecycle workflow.',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
  },
  {
    icon: Calendar,
    title: 'Timetable Scheduling',
    desc: 'Build and manage class timetables with drag-and-drop simplicity. Assign subjects, teachers, and time slots effortlessly.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
  },
  {
    icon: Layers,
    title: 'Classroom Management',
    desc: 'Create classrooms, manage capacity, track enrollment, and archive old classes — all from one unified dashboard.',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
  },
  {
    icon: BookOpenCheck,
    title: 'Assignments & Academics',
    desc: 'Create assignments, set deadlines, and track academic progress. Keep students and teachers aligned on coursework.',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-100',
  },
  {
    icon: Activity,
    title: 'Activity & Audit Logs',
    desc: 'Full transparency with detailed activity logs. Track every action across the platform for accountability and compliance.',
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
    border: 'border-cyan-100',
  },
];

/* ═══════════════════════════════════════════════════════════════════
   HOW IT WORKS DATA
═══════════════════════════════════════════════════════════════════ */
const STEPS = [
  {
    num: '01',
    icon: Globe,
    title: 'Choose Your Portal',
    desc: 'Select from Admin, Teacher, or Student portal based on your role in the institution.',
    color: 'from-blue-500 to-indigo-500',
  },
  {
    num: '02',
    icon: Lock,
    title: 'Secure Login',
    desc: 'Access your personalized dashboard with secure, role-based authentication powered by JWT.',
    color: 'from-indigo-500 to-violet-500',
  },
  {
    num: '03',
    icon: Zap,
    title: 'Manage Everything',
    desc: 'From students and classrooms to exams and timetables — manage your entire school from one place.',
    color: 'from-violet-500 to-purple-500',
  },
];

/* ═══════════════════════════════════════════════════════════════════
   ROLE PORTALS DATA
═══════════════════════════════════════════════════════════════════ */
const PORTALS = [
  {
    icon: ShieldCheck,
    title: 'Admin Portal',
    desc: 'Complete control over students, teachers, classrooms, exams, timetables, subjects, and system settings.',
    color: 'text-blue-600',
    bg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
    border: 'border-blue-200',
    hoverBorder: 'hover:border-blue-400',
    iconBg: 'bg-blue-100',
  },
  {
    icon: UserSquare,
    title: 'Teacher Portal',
    desc: 'Manage your assigned classes, mark attendance, create assignments, enter exam marks, and track student progress.',
    color: 'text-emerald-600',
    bg: 'bg-gradient-to-br from-emerald-50 to-teal-50',
    border: 'border-emerald-200',
    hoverBorder: 'hover:border-emerald-400',
    iconBg: 'bg-emerald-100',
  },
  {
    icon: GraduationCap,
    title: 'Student Portal',
    desc: 'View your timetable, check exam schedules, access assignment details, and track your academic performance.',
    color: 'text-orange-600',
    bg: 'bg-gradient-to-br from-orange-50 to-amber-50',
    border: 'border-orange-200',
    hoverBorder: 'hover:border-orange-400',
    iconBg: 'bg-orange-100',
  },
];

/* ═══════════════════════════════════════════════════════════════════
   STAT DATA
═══════════════════════════════════════════════════════════════════ */
const STATS = [
  { value: '3', suffix: '', label: 'Role Portals', icon: Users },
  { value: '11', suffix: '+', label: 'Modules', icon: Layers },
  { value: '100', suffix: '%', label: 'Real-time', icon: Activity },
  { value: '24', suffix: '/7', label: 'Secure Access', icon: Lock },
];

/* ═══════════════════════════════════════════════════════════════════
   MAIN LANDING PAGE
═══════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleGetStarted = () => {
    setIsLoading(true);
    router.push('/select-role');
  };

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col min-h-screen bg-white overflow-x-hidden">

      {/* ═══════════ NAVBAR ═══════════ */}
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled
        ? 'bg-white/90 backdrop-blur-xl shadow-sm border-b border-slate-200/60'
        : 'bg-transparent'
        }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-md shadow-blue-200/50 group-hover:shadow-blue-300/60 transition-shadow">
              <School className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-mono font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Manger
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {['features', 'how-it-works', 'about'].map((id) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors capitalize"
              >
                {id.replace(/-/g, ' ')}
              </button>
            ))}
          </div>

          <button
            onClick={handleGetStarted}
            className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-md shadow-blue-200/50 hover:shadow-blue-300/60 hover:-translate-y-0.5"
          >
            Get Started
          </button>
        </div>
      </nav>

      <main className="flex-grow">

        {/* ═══════════ HERO ═══════════ */}
        <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-20 left-[10%] w-72 h-72 bg-blue-100/40 rounded-full blur-3xl animate-pulse-glow" />
            <div className="absolute bottom-10 right-[8%] w-96 h-96 bg-indigo-100/30 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '2s' }} />
            <div className="absolute top-32 right-[15%] animate-float opacity-20">
              <BookOpen className="h-12 w-12 text-blue-400" />
            </div>
            <div className="absolute bottom-24 left-[12%] animate-float-reverse opacity-20">
              <GraduationCap className="h-14 w-14 text-indigo-400" />
            </div>
            <div className="absolute top-48 left-[5%] animate-float-slow opacity-15">
              <Star className="h-8 w-8 text-amber-400" />
            </div>
            <div className="absolute bottom-32 right-[20%] animate-float opacity-15" style={{ animationDelay: '1s' }}>
              <Sparkles className="h-10 w-10 text-violet-400" />
            </div>
          </div>

          <div className="relative max-w-5xl mx-auto px-4 text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-200/60 rounded-full text-sm font-medium text-blue-700 mb-8"
            >
              <Sparkles className="h-3.5 w-3.5" />
              School ERP System — Built for Modern Institutions
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl sm:text-5xl md:text-7xl font-mono font-bold tracking-tight leading-[1.1]"
            >
              <span className="text-slate-900">The Modern </span>
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent animate-gradient">
                Command Center
              </span>
              <br />
              <span className="text-slate-900">for Your School</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="mt-6 text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed"
            >
              Manger is a unified ERP platform that brings administrators, teachers, and students
              together. Simplify operations, track academics, and manage your entire institution
              from a single dashboard.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <button
                onClick={handleGetStarted}
                disabled={isLoading}
                className="group px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-base font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg shadow-blue-200/50 hover:shadow-blue-300/60 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? 'Redirecting...' : 'Go to Portal'}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="px-8 py-3.5 border border-slate-200 text-slate-600 text-base font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-300"
              >
                Explore Features
              </button>
            </motion.div>
          </div>
        </section>

        {/* ═══════════ STATS BAR ═══════════ */}
        <AnimatedSection className="py-6 border-y border-slate-100 bg-slate-50/50">
          <div className="max-w-5xl mx-auto px-4">
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4"
            >
              {STATS.map((s, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  transition={{ duration: 0.5 }}
                  className="flex items-center gap-3 justify-center"
                >
                  <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                    <s.icon className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800 font-mono">
                      <AnimatedCounter value={s.value} suffix={s.suffix} />
                    </p>
                    <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </AnimatedSection>

        {/* ═══════════ FEATURES ═══════════ */}
        <section id="features" className="py-24 md:py-32">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-200/60 rounded-full text-xs font-semibold text-indigo-600 mb-4 uppercase tracking-wider">
                <Layers className="h-3 w-3" />
                Features
              </div>
              <h2 className="text-3xl md:text-4xl font-mono font-bold text-slate-900 tracking-tight">
                Everything Your School Needs
              </h2>
              <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
                A comprehensive suite of modules designed to digitize and streamline every aspect of school administration.
              </p>
            </AnimatedSection>

            <motion.div
              variants={staggerSlow}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
            >
              {FEATURES.map((f, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  transition={{ duration: 0.5 }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className={`group relative bg-white rounded-2xl border ${f.border} p-6 cursor-default transition-shadow duration-300 hover:shadow-xl hover:shadow-slate-200/50`}
                >
                  <div className={`inline-flex p-3 rounded-xl ${f.bg} mb-4`}>
                    <f.icon className={`h-6 w-6 ${f.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                  <div className={`absolute bottom-0 left-6 right-6 h-0.5 ${f.bg} rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ═══════════ HOW IT WORKS ═══════════ */}
        <section id="how-it-works" className="py-24 md:py-32 bg-gradient-to-b from-slate-50 to-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-50 border border-violet-200/60 rounded-full text-xs font-semibold text-violet-600 mb-4 uppercase tracking-wider">
                <Clock className="h-3 w-3" />
                How It Works
              </div>
              <h2 className="text-3xl md:text-4xl font-mono font-bold text-slate-900 tracking-tight">
                Get Started in 3 Simple Steps
              </h2>
              <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">
                Designed for simplicity — from first visit to full management in minutes.
              </p>
            </AnimatedSection>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              className="grid md:grid-cols-3 gap-8 relative"
            >
              {/* Connecting line */}
              <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-violet-200" />

              {STEPS.map((s, i) => (
                <motion.div
                  key={i}
                  variants={scaleIn}
                  transition={{ duration: 0.5 }}
                  className="relative text-center"
                >
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${s.color} text-white shadow-lg mb-5 relative z-10`}>
                    <s.icon className="h-6 w-6" />
                  </div>
                  <div className="absolute -top-2 -right-1 md:right-auto md:left-[58%] bg-white border border-slate-200 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm z-20">
                    {s.num}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">{s.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ═══════════ ROLE PORTALS ═══════════ */}
        <section className="py-24 md:py-32">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200/60 rounded-full text-xs font-semibold text-emerald-600 mb-4 uppercase tracking-wider">
                <ShieldCheck className="h-3 w-3" />
                Portals
              </div>
              <h2 className="text-3xl md:text-4xl font-mono font-bold text-slate-900 tracking-tight">
                One Platform, Three Portals
              </h2>
              <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">
                Every user gets a tailored experience designed for their specific role and needs.
              </p>
            </AnimatedSection>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              className="grid md:grid-cols-3 gap-6"
            >
              {PORTALS.map((p, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  transition={{ duration: 0.5 }}
                  whileHover={{ y: -8, transition: { duration: 0.25 } }}
                  onClick={handleGetStarted}
                  className={`group relative ${p.bg} rounded-2xl border ${p.border} ${p.hoverBorder} p-7 cursor-pointer transition-all duration-300 hover:shadow-xl`}
                >
                  <div className={`inline-flex p-3.5 rounded-xl ${p.iconBg} mb-5`}>
                    <p.icon className={`h-7 w-7 ${p.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">{p.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-5">{p.desc}</p>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-slate-400 group-hover:text-slate-700 transition-colors">
                    <span>Enter Portal</span>
                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ═══════════ ABOUT / DEVELOPER ═══════════ */}
        <section id="about" className="py-24 md:py-32 bg-gradient-to-b from-slate-50 to-slate-100/50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-200/60 rounded-full text-xs font-semibold text-rose-600 mb-4 uppercase tracking-wider">
                  <Heart className="h-3 w-3" />
                  About the Project
                </div>
                <h2 className="text-3xl md:text-4xl font-mono font-bold text-slate-900 tracking-tight">
                  Built with Purpose
                </h2>
                <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
                  Manger is a full-stack School ERP System designed to simplify the complexities of
                  school administration. From managing student records and teacher assignments to
                  scheduling exams and generating timetables — it brings everything under one roof.
                </p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-14 bg-white rounded-2xl border border-slate-200 p-8 md:p-10 shadow-sm"
              >
                <div className="flex flex-col md:flex-row items-center gap-8">
                  {/* Developer avatar */}
                  <div className="shrink-0">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200/50">
                      <Code2 className="h-10 w-10 text-white" />
                    </div>
                  </div>

                  <div className="text-center md:text-left flex-1">
                    <h3 className="text-2xl font-bold text-slate-900">Vansh Salgotra</h3>
                    <p className="text-indigo-600 font-medium text-sm mt-1">Backend Developer & Project Creator</p>
                    <p className="mt-3 text-slate-500 leading-relaxed">
                      The brain behind Manger — Vansh designed and developed the entire backend
                      architecture including REST APIs, secure authentication, database modeling,
                      and business logic. The frontend interface was designed to deliver
                      a modern and polished user experience.
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatedSection>
          </div>
        </section>

        {/* ═══════════ CTA BANNER ═══════════ */}
        <AnimatedSection className="py-20 md:py-24">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-3xl px-8 py-14 md:px-16 md:py-20 overflow-hidden">
              {/* Decorative */}
              <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/3" />

              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-mono font-bold text-white tracking-tight">
                  Ready to Transform Your School?
                </h2>
                <p className="mt-4 text-blue-100 text-lg max-w-xl mx-auto">
                  Join the future of school management. Start using Manger today.
                </p>
                <button
                  onClick={handleGetStarted}
                  disabled={isLoading}
                  className="mt-8 inline-flex items-center gap-2 px-8 py-3.5 bg-white text-indigo-700 text-base font-bold rounded-xl hover:bg-blue-50 transition-all duration-300 shadow-lg hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {isLoading ? 'Redirecting...' : 'Get Started Now'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </main>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="bg-slate-900 text-slate-400 pt-16 pb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-10 pb-10 border-b border-slate-800">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl">
                  <School className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-mono font-bold text-white">Manger</span>
              </div>
              <p className="text-sm leading-relaxed">
                A comprehensive School ERP System that unifies administration, teaching,
                and learning into one powerful platform.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Quick Links</h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'Features', action: () => scrollToSection('features') },
                  { label: 'How It Works', action: () => scrollToSection('how-it-works') },
                  { label: 'About', action: () => scrollToSection('about') },
                  { label: 'Select Portal', href: '/select-role' },
                ].map((link) => (
                  <li key={link.label}>
                    {link.href ? (
                      <Link href={link.href} className="text-sm hover:text-white transition-colors">
                        {link.label}
                      </Link>
                    ) : (
                      <button onClick={link.action} className="text-sm hover:text-white transition-colors">
                        {link.label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* About */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">About</h4>
              <p className="text-sm leading-relaxed">
                Built by <span className="text-white font-medium">Vansh Salgotra</span>. Backend
                architecture & APIs developed from scratch. Frontend UI crafted
                for a modern experience.
              </p>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
            <p>© {new Date().getFullYear()} Manger. All rights reserved.</p>
            <p className="flex items-center gap-1.5">
              Created by
              <span className="font-semibold text-white">Vansh Salgotra</span>
              <Heart className="h-3 w-3 text-rose-500 fill-rose-500" />
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
