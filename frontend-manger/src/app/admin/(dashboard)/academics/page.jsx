'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Calendar, CheckCircle2, XCircle, Edit, Trash2, Lock, Unlock,
  ArrowRight, AlertTriangle, RefreshCw, Info, Users, GraduationCap,
  ArrowUpCircle, Eye, Loader2, ChevronDown, ChevronUp, BookOpen,
  Lightbulb, CircleHelp, Star, Zap, Shield
} from 'lucide-react';
import { format } from 'date-fns';
import apiClient from '@/lib/axios';
import { showSuccess, showError } from '@/lib/toastHelper';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

/* ─── State helpers ────────────────────────────────────────────────────────── */
const isCur    = (y) => y.current === true || y.current === 'true';
const isClo    = (y) => y.closed === true    || y.closed === 'true';
const isActive        = (y) =>  isCur(y) && !isClo(y);
const isClosedCurrent = (y) =>  isCur(y) &&  isClo(y);
const isHistorical    = (y) => !isCur(y) &&  isClo(y);
const isAvailable     = (y) => !isCur(y) && !isClo(y);

/* ─── Step Guide ────────────────────────────────────────────────────────────── */
function StepGuide({ steps }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-indigo-600 rounded-lg">
            <Lightbulb className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-indigo-900 text-sm">Quick Start Guide — How does this work?</span>
          <span className="text-[11px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-medium hidden sm:inline">Beginner Friendly</span>
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 text-indigo-500 shrink-0" />
          : <ChevronDown className="h-4 w-4 text-indigo-500 shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {steps.map((step, i) => (
              <div key={i} className="bg-white/80 border border-indigo-100 rounded-xl p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  <p className="font-bold text-indigo-900 text-sm">{step.title}</p>
                </div>
                <p className="text-xs text-indigo-700 leading-relaxed">{step.desc}</p>
                {step.tip && (
                  <div className="mt-auto pt-2 border-t border-indigo-100 flex items-start gap-1.5">
                    <Star className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-700">{step.tip}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Notice Banner ─────────────────────────────────────────────────────────── */
function NoticeBanner({ type = 'info', title, children }) {
  const styles = {
    info:    { wrap: 'bg-blue-50 border-blue-200',    icon: 'bg-blue-100 text-blue-600',    title: 'text-blue-900',  body: 'text-blue-800' },
    warning: { wrap: 'bg-amber-50 border-amber-200',  icon: 'bg-amber-100 text-amber-600',  title: 'text-amber-900', body: 'text-amber-800' },
    success: { wrap: 'bg-emerald-50 border-emerald-200', icon: 'bg-emerald-100 text-emerald-600', title: 'text-emerald-900', body: 'text-emerald-800' },
    danger:  { wrap: 'bg-red-50 border-red-200',      icon: 'bg-red-100 text-red-600',      title: 'text-red-900',  body: 'text-red-800' },
  };
  const s = styles[type];
  const Icon = type === 'warning' ? AlertTriangle : type === 'danger' ? XCircle : type === 'success' ? CheckCircle2 : Info;
  return (
    <div className={`rounded-xl border ${s.wrap} p-4 flex gap-3`}>
      <div className={`p-2 rounded-lg shrink-0 h-fit ${s.icon}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        {title && <p className={`font-bold text-sm mb-1.5 ${s.title}`}>{title}</p>}
        <div className={`text-sm leading-relaxed ${s.body}`}>{children}</div>
      </div>
    </div>
  );
}

/* ─── Status Pill ────────────────────────────────────────────────────────────── */
function StatusPill({ year }) {
  if (isActive(year))        return <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />Active</span>;
  if (isClosedCurrent(year)) return <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200"><Lock className="h-3 w-3" />Closed</span>;
  if (isHistorical(year))    return <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200"><Lock className="h-3 w-3" />Historical</span>;
  return                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200"><Unlock className="h-3 w-3" />Available</span>;
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════════════ */
export default function AcademicYearPage() {
  const [academicYears, setAcademicYears] = useState([]);
  const [classrooms, setClassrooms]       = useState([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [isRefreshing, setIsRefreshing]   = useState(false);

  const [isCreateDialogOpen, setIsCreateDialogOpen]         = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen]             = useState(false);
  const [isCloseDialogOpen, setIsCloseDialogOpen]           = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen]         = useState(false);
  const [isPromotionConfirmOpen, setIsPromotionConfirmOpen] = useState(false);

  const [formData, setFormData]       = useState({ name: '', startDate: '', endDate: '' });
  const [editingYear, setEditingYear] = useState(null);
  const [deletingYear, setDeletingYear] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentYear, setCurrentYear]   = useState(null);
  const [activeTab, setActiveTab]       = useState('years');

  // Promotion state
  const [promotionResult, setPromotionResult]   = useState(null);   // SchoolPromotionResultDTO
  const [promotionLoading, setPromotionLoading] = useState(false);
  const [promotionAction, setPromotionAction]   = useState(null);   // 'preview' | 'run'

  const router = useRouter();

  /* ── fetch ─────────────────────────────────────────────────────────────── */
  const fetchAcademicYears = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true); else setIsRefreshing(true);
    try {
      const res = await apiClient.get('/api/admin/academic-years');
      const years = res.data;
      setAcademicYears(years);
      setCurrentYear(years.find(y => y.current === true) || null);
    } catch { showError('Failed to load academic years'); }
    finally { setIsLoading(false); setIsRefreshing(false); }
  }, []);

  const fetchClassrooms = useCallback(async () => {
    try { setClassrooms((await apiClient.get('/api/admin/classrooms')).data); }
    catch { showError('Failed to load classrooms'); }
  }, []);

  useEffect(() => { fetchAcademicYears(); fetchClassrooms(); }, [fetchAcademicYears, fetchClassrooms]);

  /* ── CRUD ───────────────────────────────────────────────────────────────── */
  const handleCreate = async (e) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      await apiClient.post('/api/admin/academic-years', formData);
      showSuccess('Academic year created successfully!');
      setIsCreateDialogOpen(false); setFormData({ name: '', startDate: '', endDate: '' });
      fetchAcademicYears(true);
    } catch (err) { showError(err.response?.data?.message || 'Failed to create'); }
    finally { setIsSubmitting(false); }
  };

  const handleEdit = async (e) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      await apiClient.put(`/api/admin/academic-years/${editingYear.id}`, formData);
      showSuccess('Academic year updated');
      setIsEditDialogOpen(false); setEditingYear(null); setFormData({ name: '', startDate: '', endDate: '' });
      fetchAcademicYears(true);
    } catch (err) { showError(err.response?.data?.message || 'Failed to update'); }
    finally { setIsSubmitting(false); }
  };

  const handleSetCurrent = async (yearId) => {
    try {
      await apiClient.put(`/api/admin/academic-years/${yearId}/set-current`);
      showSuccess('Academic year activated — all others closed');
      fetchAcademicYears(true);
    } catch (err) { showError(err.response?.data?.message || 'Failed to set current year'); }
  };

  const handleCloseYear = async () => {
    setIsSubmitting(true);
    try {
      await apiClient.post('/api/admin/academic-years/close-current');
      showSuccess('Year closed — go to Promotions tab to promote students');
      setIsCloseDialogOpen(false); fetchAcademicYears(true);
    } catch (err) { showError(err.response?.data?.message || 'Failed to close year'); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await apiClient.delete(`/api/admin/academic-years/${deletingYear.id}`);
      showSuccess('Academic year deleted');
      setIsDeleteDialogOpen(false); setDeletingYear(null); fetchAcademicYears(true);
    } catch (err) { showError(err.response?.data?.message || 'Failed to delete'); }
    finally { setIsSubmitting(false); }
  };

  /* ── Promotions ─────────────────────────────────────────────────────────── */
  const handlePreviewPromotion = async () => {
    setPromotionLoading(true); setPromotionAction('preview');
    try {
      const res = await apiClient.get('/api/admin/promotions/preview');
      setPromotionResult(res.data);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load preview');
    } finally { setPromotionLoading(false); setPromotionAction(null); }
  };

  const handleRunPromotion = async () => {
    setIsPromotionConfirmOpen(false);
    setPromotionLoading(true); setPromotionAction('run');
    try {
      const res = await apiClient.post('/api/admin/promotions/run');
      setPromotionResult(res.data);
      showSuccess(`Promotion complete! ${res.data.totalPromoted} promoted, ${res.data.totalGraduated} graduated.`);
      fetchAcademicYears(true);
    } catch (err) {
      showError(err.response?.data?.message || 'Promotion failed');
    } finally { setPromotionLoading(false); setPromotionAction(null); }
  };

  const openEditDialog = (year) => {
    setEditingYear(year);
    setFormData({ name: year.name, startDate: year.startDate, endDate: year.endDate });
    setIsEditDialogOpen(true);
  };



  if (isLoading) return (
    <div className="p-6 space-y-4 max-w-5xl mx-auto">
      {[80, '100%', '100%'].map((w, i) => <Skeleton key={i} style={{ width: typeof w === 'number' ? w : w }} className={`h-${i === 0 ? 12 : i === 1 ? 32 : 64} rounded-2xl`} />)}
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-5 lg:px-8 py-6 space-y-5">

        {/* Page header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="h-6 w-6 text-indigo-600" /> Academic Year Manager
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage school years and promote students</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchAcademicYears(true)} disabled={isRefreshing} className="h-8 text-xs">
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button size="sm" onClick={() => { setFormData({ name: '', startDate: '', endDate: '' }); setIsCreateDialogOpen(true); }}
              className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> New Academic Year
            </Button>
          </div>
        </div>

        {/* Current Year Status Card */}
        {currentYear ? (
          <div className={`rounded-2xl border-2 p-5 ${isActive(currentYear)
            ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300'
            : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${isActive(currentYear) ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                  {isActive(currentYear) ? <Zap className="h-6 w-6 text-emerald-600" /> : <Shield className="h-6 w-6 text-amber-600" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <StatusPill year={currentYear} />
                    <span className="text-xs text-slate-500 font-medium">Currently Selected Year</span>
                  </div>
                  <p className="text-xl font-bold text-slate-900">{currentYear.name}</p>
                  <p className="text-sm text-slate-600 mt-0.5">
                    {format(new Date(currentYear.startDate), 'MMMM d, yyyy')}
                    <span className="mx-2 text-slate-400">→</span>
                    {format(new Date(currentYear.endDate), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isActive(currentYear) && (
                  <Button onClick={() => setIsCloseDialogOpen(true)}
                    className="bg-amber-500 hover:bg-amber-600 text-white">
                    <Lock className="h-4 w-4 mr-2" /> Close This Year
                  </Button>
                )}
                {isClosedCurrent(currentYear) && (
                  <Button onClick={() => setActiveTab('promotions')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <ArrowUpCircle className="h-4 w-4 mr-2" /> Go to Promotions
                  </Button>
                )}
              </div>
            </div>
            {isClosedCurrent(currentYear) && (
              <div className="mt-3 pt-3 border-t border-amber-200 flex items-start gap-2">
                <Info className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  This year is <strong>closed and locked</strong>. Student records cannot be modified. 
                  Click <strong>"Go to Promotions"</strong> to move students to the next grade.
                </p>
              </div>
            )}
          </div>
        ) : (
          <NoticeBanner type="warning" title="No Active Year Set">
            You haven't set any academic year as current yet. Create a year below and click <strong>"Set as Active"</strong> to begin.
          </NoticeBanner>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-slate-200 rounded-xl p-1 h-11">
            <TabsTrigger value="years"
              className="text-sm px-5 h-9 rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-sm font-medium">
              <Calendar className="h-3.5 w-3.5 mr-2" /> Academic Years
            </TabsTrigger>
            <TabsTrigger value="promotions"
              className="text-sm px-5 h-9 rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-sm font-medium">
              <ArrowUpCircle className="h-3.5 w-3.5 mr-2" /> Student Promotions
            </TabsTrigger>
          </TabsList>

          {/* ── YEARS TAB ─────────────────────────────────────────────────── */}
          <TabsContent value="years" className="mt-5 space-y-4">
            <StepGuide steps={[
              { title: 'Create a Year',    desc: 'Start by creating a new academic year e.g. "2025–2026" with its start and end dates.', tip: 'You can create next year\'s entry before the current one ends.' },
              { title: 'Set as Active',    desc: 'Click "Set as Active" on the year you want to use. This makes it the current school year.', tip: 'Only ONE year can be active at a time.' },
              { title: 'Manage Records',   desc: 'All student enrollments, attendance and marks are linked to the active year.', tip: 'You can edit dates anytime while the year is not yet closed.' },
              { title: 'Close When Done',  desc: 'At year-end, close the year to lock records. Then promote students to the next grade.', tip: 'Closing does NOT delete the year — records are preserved.' },
            ]} />

            {/* Table card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-bold text-slate-800">All Academic Years</p>
                  <p className="text-xs text-slate-400 mt-0.5">{academicYears.length} year{academicYears.length !== 1 ? 's' : ''} in this school</p>
                </div>
                <Button size="sm" variant="outline"
                  onClick={() => { setFormData({ name: '', startDate: '', endDate: '' }); setIsCreateDialogOpen(true); }}
                  className="h-8 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Year
                </Button>
              </div>

              {academicYears.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-8">
                  <div className="p-5 bg-slate-100 rounded-2xl mb-4">
                    <Calendar className="h-10 w-10 text-slate-400 mx-auto" />
                  </div>
                  <p className="font-bold text-slate-700 text-base mb-1">No academic years yet</p>
                  <p className="text-sm text-slate-400 mb-5 max-w-xs">Create your first academic year to start managing student enrollments.</p>
                  <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="h-4 w-4 mr-2" /> Create First Academic Year
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                        <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-5">Year</TableHead>
                        <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Duration</TableHead>
                        <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</TableHead>
                        <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-right pr-5">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {academicYears.map((year) => (
                        <TableRow key={year.id}
                          className={`transition-colors ${isActive(year) ? 'bg-emerald-50/40 hover:bg-emerald-50/60' : isClosedCurrent(year) ? 'bg-amber-50/40 hover:bg-amber-50/60' : 'hover:bg-slate-50/60'}`}>
                          <TableCell className="pl-5">
                            <div className="flex items-center gap-3">
                              <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0
                                ${isActive(year) ? 'bg-emerald-100 text-emerald-700' : isClosedCurrent(year) ? 'bg-amber-100 text-amber-700' : isHistorical(year) ? 'bg-slate-100 text-slate-500' : 'bg-indigo-50 text-indigo-600'}`}>
                                {year.name.slice(-2)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800">{year.name}</p>
                                <p className="text-[10px] mt-0.5 font-medium
                                  ${isActive(year) ? 'text-emerald-600' : isClosedCurrent(year) ? 'text-amber-600' : isHistorical(year) ? 'text-slate-400' : 'text-indigo-500'}">
                                  {isActive(year) && <span className="text-emerald-600">✓ Currently active school year</span>}
                                  {isClosedCurrent(year) && <span className="text-amber-600">Locked — ready for promotions</span>}
                                  {isHistorical(year) && <span className="text-slate-400">Past year — records preserved</span>}
                                  {isAvailable(year) && <span className="text-indigo-500">Not active yet — click Set as Active</span>}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm text-slate-700 font-medium">{format(new Date(year.startDate), 'MMM d, yyyy')}</p>
                            <p className="text-xs text-slate-400">to {format(new Date(year.endDate), 'MMM d, yyyy')}</p>
                          </TableCell>
                          <TableCell><StatusPill year={year} /></TableCell>
                          <TableCell className="pr-5">
                            <div className="flex justify-end items-center gap-1.5 flex-wrap">
                              {/* ACTIVE: show Close button + Edit */}
                              {isActive(year) && (
                                <>
                                  <Button size="sm" onClick={() => setIsCloseDialogOpen(true)}
                                    className="h-7 text-xs bg-amber-500 hover:bg-amber-600 text-white px-3">
                                    <Lock className="h-3 w-3 mr-1" /> Close Year
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(year)}
                                    title="Edit this year"
                                    className="h-7 w-7 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              )}
                              {/* CLOSED CURRENT: show Go to Promotions */}
                              {isClosedCurrent(year) && (
                                <Button size="sm" onClick={() => setActiveTab('promotions')}
                                  className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3">
                                  <ArrowUpCircle className="h-3 w-3 mr-1" /> Promotions
                                </Button>
                              )}
                              {/* AVAILABLE: Set as Active + Edit + Delete */}
                              {isAvailable(year) && (
                                <>
                                  <Button size="sm" onClick={() => handleSetCurrent(year.id)}
                                    className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3">
                                    <Zap className="h-3 w-3 mr-1" /> Set as Active
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(year)}
                                    title="Edit this year"
                                    className="h-7 w-7 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon"
                                    onClick={() => { setDeletingYear(year); setIsDeleteDialogOpen(true); }}
                                    title="Delete this year"
                                    className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              )}
                              {/* HISTORICAL: Reopen & Activate */}
                              {isHistorical(year) && (
                                <Button size="sm" variant="outline" onClick={() => handleSetCurrent(year.id)}
                                  className="h-7 text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50 px-3">
                                  <Unlock className="h-3 w-3 mr-1" /> Reopen & Activate
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Status legend */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <CircleHelp className="h-3.5 w-3.5" /> What do the status labels mean?
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Active',     desc: 'Current school year. Records are editable. Students can be enrolled.' },
                  { color: 'bg-amber-100 text-amber-800 border-amber-200',       label: 'Closed',     desc: 'Year locked. No new records. Ready to run student promotions.' },
                  { color: 'bg-slate-100 text-slate-600 border-slate-200',       label: 'Historical', desc: 'Past year, read-only. Can be reopened and set as active if needed.' },
                  { color: 'bg-blue-50 text-blue-700 border-blue-200',           label: 'Available',  desc: 'Created but not yet active. Use "Set as Active" to begin using it.' },
                ].map(({ color, label, desc }) => (
                  <div key={label} className="flex flex-col gap-2">
                    <span className={`self-start text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${color}`}>{label}</span>
                    <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>


          {/* ── PROMOTIONS TAB ─────────────────────────────────────────────── */}
          <TabsContent value="promotions" className="mt-5 space-y-4">
            <StepGuide steps={[
              { title: 'Close Current Year', desc: 'Go to Academic Years tab → "Close This Year". This locks all records.', tip: 'You cannot promote while the year is still active.' },
              { title: 'Create Next Year',   desc: 'Make sure the next year (e.g. 2025-26) is already created in Academic Years tab.', tip: 'It does NOT need to be set as active — just needs to exist.' },
              { title: 'Preview',            desc: 'Click "Preview Promotion" to see exactly what will happen to every classroom before anything changes.', tip: 'Always preview first — this affects the entire school.' },
              { title: 'Run Promotion',      desc: 'Click "Run School Promotion" — every student in every class moves to the next grade in one click.', tip: 'Grade 12 students graduate automatically. Safe to re-run.' },
            ]} />

            {/* Year not closed warning */}
            {currentYear && !currentYear.closed && (
              <NoticeBanner type="danger" title="Action Required: Close the Current Year First">
                <p>Before promoting, you must close <strong>{currentYear.name}</strong>.</p>
                <button onClick={() => setActiveTab('years')}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-red-700 underline underline-offset-2 hover:text-red-900">
                  <ArrowRight className="h-3.5 w-3.5" /> Go to Academic Years tab
                </button>
              </NoticeBanner>
            )}
            {!currentYear && (
              <NoticeBanner type="warning" title="No Active Year Set">
                Set an academic year as current before promoting students.
              </NoticeBanner>
            )}

            {/* Main promotion panel */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

              {/* Header with action buttons */}
              <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-slate-800 text-base flex items-center gap-2">
                    <ArrowUpCircle className="h-5 w-5 text-indigo-600" />
                    School-Wide Year-End Promotion
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Promotes <strong>every student in every classroom</strong> to the next grade. Grade 12 → Graduated automatically.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" size="sm"
                    onClick={handlePreviewPromotion}
                    disabled={promotionLoading || !currentYear?.closed}
                    className="h-9 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                    {promotionLoading && promotionAction === 'preview'
                      ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      : <Eye className="h-3.5 w-3.5 mr-1.5" />}
                    Preview
                  </Button>
                  <Button size="sm"
                    onClick={() => setIsPromotionConfirmOpen(true)}
                    disabled={promotionLoading || !currentYear?.closed}
                    className="h-9 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-5">
                    <ArrowUpCircle className="h-3.5 w-3.5 mr-1.5" />
                    Run School Promotion
                  </Button>
                </div>
              </div>

              {/* What promotion does — shown when no result yet */}
              {!promotionResult && (
                <div className="p-6">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">What happens when you run promotion</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { icon: '📈', label: 'Active Students',    color: 'bg-emerald-50 border-emerald-200', desc: 'Moved to next grade in the new year with a new roll number.' },
                      { icon: '🎓', label: 'Grade 12 Students',  color: 'bg-violet-50 border-violet-200',   desc: 'Marked Graduated. They leave the school. No new enrollment.' },
                      { icon: '🔁', label: 'Dropped Out / Suspended', color: 'bg-amber-50 border-amber-200', desc: 'Counted as detained — handled separately by admin.' },
                      { icon: '⏭', label: 'Already Promoted',   color: 'bg-slate-50 border-slate-200',    desc: 'Skipped automatically. Safe to re-run at any time.' },
                    ].map(({ icon, label, color, desc }) => (
                      <div key={label} className={`border rounded-xl p-4 ${color}`}>
                        <div className="text-2xl mb-2">{icon}</div>
                        <p className="font-bold text-slate-800 text-sm mb-1">{label}</p>
                        <p className="text-xs text-slate-600 leading-relaxed">{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview / Result display */}
              {promotionResult && (
                <div className="p-6 space-y-5">

                  {/* Summary banner */}
                  <div className={`rounded-xl border p-4 ${promotionResult.executed ? 'bg-emerald-50 border-emerald-200' : 'bg-indigo-50 border-indigo-200'}`}>
                    <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${promotionResult.executed ? 'text-emerald-700' : 'text-indigo-700'}`}>
                      {promotionResult.executed
                        ? `✓ Promotion Complete — ${promotionResult.currentYear} → ${promotionResult.nextYear}`
                        : `Preview — ${promotionResult.currentYear} → ${promotionResult.nextYear} (no changes made)`}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        { label: 'Promoted',    value: promotionResult.totalPromoted,    color: 'text-emerald-700' },
                        { label: 'Graduated',   value: promotionResult.totalGraduated,   color: 'text-violet-700'  },
                        { label: 'Detained',    value: promotionResult.totalDetained,    color: 'text-amber-700'   },
                        { label: 'Skipped',     value: promotionResult.totalSkipped,     color: 'text-slate-500'   },
                        { label: 'Already Done',value: promotionResult.totalAlreadyDone, color: 'text-slate-400'   },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="bg-white border border-slate-200 rounded-xl p-3 text-center">
                          <p className={`text-2xl font-bold ${color}`}>{value}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
                        </div>
                      ))}
                    </div>
                    {promotionResult.failedClassrooms > 0 && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs text-red-700 font-semibold">
                          ⚠ {promotionResult.failedClassrooms} classroom(s) could not be promoted — target classroom not found.
                          Create the missing classrooms then re-run.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Per-classroom breakdown table */}
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Per-Classroom Breakdown</p>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="text-xs font-bold text-slate-500 pl-4">From</TableHead>
                            <TableHead className="text-xs font-bold text-slate-500">To</TableHead>
                            <TableHead className="text-xs font-bold text-slate-500 text-center">Promoted</TableHead>
                            <TableHead className="text-xs font-bold text-slate-500 text-center">Graduated</TableHead>
                            <TableHead className="text-xs font-bold text-slate-500 text-center">Detained</TableHead>
                            <TableHead className="text-xs font-bold text-slate-500 text-center">Skipped</TableHead>
                            <TableHead className="text-xs font-bold text-slate-500 pr-4">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {promotionResult.classroomResults?.map((row, i) => (
                            <TableRow key={i} className={
                              row.status === 'NO_TARGET'  ? 'bg-red-50' :
                              row.status === 'GRADUATED'  ? 'bg-violet-50/40' :
                              row.status === 'EMPTY'      ? 'bg-slate-50/50' : ''
                            }>
                              <TableCell className="pl-4 font-semibold text-slate-800 text-sm">{row.fromClassroom}</TableCell>
                              <TableCell className="text-sm text-slate-600">{row.toClassroom}</TableCell>
                              <TableCell className="text-center font-bold text-emerald-700">{row.promoted || '—'}</TableCell>
                              <TableCell className="text-center font-bold text-violet-700">{row.graduated || '—'}</TableCell>
                              <TableCell className="text-center font-bold text-amber-700">{row.detained || '—'}</TableCell>
                              <TableCell className="text-center text-slate-500">{row.skipped || '—'}</TableCell>
                              <TableCell className="pr-4">
                                {row.status === 'SUCCESS'   && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Done</span>}
                                {row.status === 'GRADUATED' && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">Graduated</span>}
                                {row.status === 'EMPTY'     && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Empty</span>}
                                {row.status === 'NO_TARGET' && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">⚠ No Target</span>}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <Button variant="outline" size="sm" onClick={() => setPromotionResult(null)} className="h-8 text-xs">
                    ← Clear Results
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

        </Tabs>
      </div>

      {/* ════════════════════ DIALOGS ════════════════════ */}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 rounded-lg"><Calendar className="h-4 w-4 text-indigo-600" /></div>
              Create New Academic Year
            </DialogTitle>
            <DialogDescription>Set the name and date range for this academic year.</DialogDescription>
          </DialogHeader>
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex gap-2 text-xs text-indigo-800">
            <Lightbulb className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
            <p>Use a name like <strong>"2025–2026"</strong>. Set dates to cover the full school year (e.g. April 2025 to March 2026).</p>
          </div>
          <form onSubmit={handleCreate}>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="font-semibold text-sm">Year Name <span className="text-red-500">*</span></Label>
                <Input placeholder="e.g. 2025–2026" value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="h-9" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-semibold text-sm">Start Date <span className="text-red-500">*</span></Label>
                  <Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} required className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-semibold text-sm">End Date <span className="text-red-500">*</span></Label>
                  <Input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} required className="h-9" />
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isSubmitting} className="h-9 text-sm">Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="h-9 text-sm bg-indigo-600 hover:bg-indigo-700">
                {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating…</> : <><Plus className="h-4 w-4 mr-2" />Create Year</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-1.5 bg-slate-100 rounded-lg"><Edit className="h-4 w-4 text-slate-600" /></div>
              Edit Academic Year
            </DialogTitle>
            <DialogDescription>Editing: <strong>{editingYear?.name}</strong></DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit}>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="font-semibold text-sm">Year Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="h-9" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-semibold text-sm">Start Date</Label>
                  <Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} required className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-semibold text-sm">End Date</Label>
                  <Input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} required className="h-9" />
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting} className="h-9 text-sm">Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="h-9 text-sm">
                {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Close Year Dialog */}
      <AlertDialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-600" /> Close Academic Year?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-slate-600">
                <p>You are about to close <strong className="text-slate-800">{currentYear?.name}</strong>.</p>
                <div className="space-y-2">
                  {[
                    'All student records and attendance will be locked (no new changes allowed)',
                    'The year stays marked as "current" so you can still run promotions',
                    'Historical records are preserved permanently — nothing is deleted',
                  ].map((text, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-xs">
                  <strong>Before closing:</strong> Make sure all attendance, marks, and student records for this year are finalized and correct.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCloseYear} disabled={isSubmitting} className="bg-amber-500 hover:bg-amber-600 text-white">
              {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Closing…</> : <><Lock className="h-4 w-4 mr-2" />Yes, Close This Year</>}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" /> Delete Academic Year?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-sm space-y-3">
                <p className="text-slate-600">You are about to permanently delete <strong className="text-slate-800">{deletingYear?.name}</strong>.</p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-xs">
                  ⚠ This <strong>cannot be undone</strong>. A year can only be deleted if it has <strong>no student enrollments</strong>.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">
              {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deleting…</> : 'Delete Permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Promotion Confirm Dialog */}
      <AlertDialog open={isPromotionConfirmOpen} onOpenChange={setIsPromotionConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" /> Confirm School-Wide Promotion
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-slate-600">
                <p>You are about to promote <strong className="text-slate-800">every student in every classroom</strong> to the next grade.</p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-xs space-y-1.5">
                  <p className="font-bold">What will happen:</p>
                  <p>• Active students → moved to next grade with new enrollment and roll number</p>
                  <p>• Grade 12 students → marked as Graduated, leave the school</p>
                  <p>• Dropped out / Suspended → counted as detained</p>
                  <p>• Old enrollments marked as "Promoted" — preserved as history</p>
                  <p>• Already-promoted students are automatically skipped (safe to re-run)</p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={promotionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRunPromotion} disabled={promotionLoading}
              className="bg-indigo-600 hover:bg-indigo-700">
              {promotionLoading
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Promoting…</>
                : <><ArrowUpCircle className="h-4 w-4 mr-2" />Yes, Promote Entire School</>}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}