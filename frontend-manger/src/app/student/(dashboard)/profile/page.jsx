'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import studentApiClient from '@/lib/studentAxios';
import {
    AlertTriangle, Book, Briefcase, Building2, Calendar, Bus, GraduationCap, Users, HeartPulse,
    Mail, MapPin, Phone, RefreshCw, School, Shield, User, GraduationCapIcon
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

/* ── Info Row ── */
const InfoRow = ({ icon: Icon, label, value, colorClass = 'text-slate-500' }) => {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3 py-2.5">
            <div className={`p-2 rounded-lg bg-slate-100 shrink-0 mt-0.5`}>
                <Icon size={16} className={colorClass} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">{label}</p>
                <p className="text-sm font-medium text-slate-800 break-words">{value}</p>
            </div>
        </div>
    );
};

/* ── Subject Chip ── */
const SubjectChip = ({ subjectName, subjectCode }) => (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100">
        <div className="h-2 w-2 rounded-full bg-orange-500 shrink-0" />
        <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{subjectName}</p>
            {subjectCode && <p className="text-[11px] text-slate-500 truncate">{subjectCode}</p>}
        </div>
    </div>
);

/* ── MAIN ── */
export default function StudentProfilePage() {
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const isMounted = useRef(false);

    const fetchProfile = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await studentApiClient.get('/api/student/profile');
            if (!isMounted.current) return;
            setProfile(res.data);
        } catch (err) {
            if (!isMounted.current) return;
            setError(err?.response?.data?.message || 'Unable to load profile.');
        } finally {
            if (isMounted.current) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        isMounted.current = true;
        fetchProfile();
        return () => { isMounted.current = false; };
    }, [fetchProfile]);

    /* ── Loading ── */
    if (isLoading) {
        return (
            <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6">
                <Skeleton className="h-48 w-full rounded-2xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Skeleton className="h-60 rounded-xl" />
                    <Skeleton className="h-60 rounded-xl" />
                </div>
            </div>
        );
    }

    /* ── Error ── */
    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] p-4">
                <div className="w-full max-w-md text-center p-6 bg-white shadow-sm rounded-xl border border-red-200">
                    <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
                    <h2 className="text-lg font-semibold text-slate-900 mb-1">Could Not Load Profile</h2>
                    <p className="text-sm text-slate-500 mb-6">{error}</p>
                    <Button className="w-full h-9 bg-orange-600 hover:bg-orange-700" onClick={fetchProfile}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                    </Button>
                </div>
            </div>
        );
    }

    if (!profile) return null;

    const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Student';
    const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6 animate-in fade-in duration-300">

            {/* ── HERO CARD ── */}
            <Card className="rounded-2xl overflow-hidden border-slate-200/80 shadow-sm relative">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-10 pointer-events-none">
                    <GraduationCap size={250} />
                </div>
                <div className="h-24 sm:h-32 bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600" />
                <CardContent className="p-4 sm:p-6 -mt-12 sm:-mt-14 relative z-10">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
                        <Avatar className="h-20 w-20 sm:h-24 sm:w-24 ring-4 ring-white shadow-lg">
                            {profile.profilePictureUrl && (
                                <AvatarImage src={`${studentApiClient.defaults.baseURL}/api/files/students/${profile.profilePictureUrl}`} alt={fullName} />
                            )}
                            <AvatarFallback className="bg-gradient-to-br from-orange-600 to-amber-600 text-white text-xl sm:text-2xl font-bold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="text-center sm:text-left flex-1 min-w-0">
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{fullName}</h1>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1.5">
                                {profile.classroomResponseDTO && (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100">
                                        <School size={12} /> Grade {profile.classroomResponseDTO.gradeLevel} - Sec {profile.classroomResponseDTO.section}
                                    </span>
                                )}
                                {profile.rollNo && (
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200/60">
                                        <GraduationCapIcon size={12} /> Roll: {profile.rollNo}
                                    </span>
                                )}
                                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${profile.status === 'ACTIVE'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-red-50 text-red-700 border border-red-200'
                                    }`}>
                                    <Shield size={12} /> {profile.status?.replace('_', ' ') || 'ACTIVE'}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* ── PERSONAL INFO ── */}
                <Card className="rounded-xl shadow-sm border-slate-200/80">
                    <CardHeader className="pb-2 p-4">
                        <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <User size={18} className="text-orange-500" /> Personal Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 divide-y divide-slate-100">
                        <InfoRow icon={Mail} label="Email" value={profile.email} colorClass="text-blue-500" />
                        <InfoRow icon={Phone} label="Student Phone" value={profile.phoneNumber} colorClass="text-emerald-500" />
                        <InfoRow icon={User} label="Gender" value={profile.gender} colorClass="text-purple-500" />
                        <InfoRow icon={Calendar} label="Admission Date" value={profile.admissionDate} colorClass="text-amber-500" />
                        <InfoRow icon={Briefcase} label="Admission Number" value={profile.admissionNo} colorClass="text-slate-500" />
                    </CardContent>
                </Card>

                {/* ── PARENT INFO ── */}
                <Card className="rounded-xl shadow-sm border-slate-200/80">
                    <CardHeader className="pb-2 p-4">
                        <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <Users size={18} className="text-indigo-500" /> Parent / Guardian Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 divide-y divide-slate-100">
                        <InfoRow icon={User} label="Father's Name" value={profile.fatherName} colorClass="text-indigo-500" />
                        <InfoRow icon={User} label="Mother's Name" value={profile.motherName} colorClass="text-pink-500" />
                        <InfoRow icon={Phone} label="Primary Contact" value={profile.parentPhonePrimary} colorClass="text-emerald-500" />
                        {profile.parentEmail && <InfoRow icon={Mail} label="Parent Email" value={profile.parentEmail} colorClass="text-blue-500" />}
                        {profile.guardianName && profile.guardianName !== profile.fatherName && profile.guardianName !== profile.motherName && (
                            <InfoRow icon={Shield} label="Guardian Name" value={profile.guardianName} colorClass="text-teal-500" />
                        )}
                    </CardContent>
                </Card>

                {/* ── CONTACT & ADDRESS INFO ── */}
                <Card className="rounded-xl shadow-sm border-slate-200/80">
                    <CardHeader className="pb-2 p-4">
                        <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <MapPin size={18} className="text-rose-500" /> Address Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 divide-y divide-slate-100">
                        <InfoRow icon={MapPin} label="Full Address" value={profile.fullAddress} colorClass="text-rose-500" />
                        <InfoRow icon={Building2} label="City" value={profile.city} colorClass="text-sky-500" />
                        <InfoRow icon={MapPin} label="State" value={profile.state} colorClass="text-violet-500" />
                        <InfoRow icon={MapPin} label="Pincode" value={profile.pincode} colorClass="text-slate-500" />
                    </CardContent>
                </Card>

                {/* ── MEDICAL & EMERGENCY INFO ── */}
                <Card className="rounded-xl shadow-sm border-slate-200/80">
                    <CardHeader className="pb-2 p-4">
                        <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <HeartPulse size={18} className="text-red-500" /> Health & Emergency
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 divide-y divide-slate-100">
                        <InfoRow icon={User} label="Emergency Contact Name" value={profile.emergencyContactName} colorClass="text-red-500" />
                        <InfoRow icon={Phone} label="Emergency Contact Number" value={profile.emergencyContactNumber} colorClass="text-red-400" />
                        <InfoRow icon={HeartPulse} label="Medical Conditions" value={profile.medicalConditions} colorClass="text-teal-500" />
                        <InfoRow icon={AlertTriangle} label="Allergies" value={profile.allergies} colorClass="text-amber-500" />
                    </CardContent>
                </Card>
                
                {/* ── ADDITIONAL DETAILS ── */}
                {(profile.transportRequired || profile.hostelRequired || profile.previousSchoolName) && (
                    <Card className="rounded-xl shadow-sm border-slate-200/80 md:col-span-2">
                        <CardHeader className="pb-2 p-4">
                            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <Briefcase size={18} className="text-teal-500" /> Additional Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 sm:gap-4 divide-y sm:divide-y-0 divide-slate-100">
                            {profile.transportRequired && <InfoRow icon={Bus} label="Transport" value="Opted for School Transport" colorClass="text-teal-500" />}
                            {profile.hostelRequired && <InfoRow icon={Building2} label="Hostel" value="Opted for School Hostel" colorClass="text-indigo-500" />}
                            <InfoRow icon={School} label="Previous School" value={profile.previousSchoolName} colorClass="text-slate-500" />
                            <InfoRow icon={GraduationCap} label="Previous Class" value={profile.previousClass} colorClass="text-orange-500" />
                        </CardContent>
                    </Card>
                )}

            </div>

            {/* ── ENROLLED SUBJECTS ── */}
            {profile.subjectResponseDTOS && profile.subjectResponseDTOS.length > 0 && (
                <Card className="rounded-xl shadow-sm border-slate-200/80">
                    <CardHeader className="pb-2 p-4 flex flex-row items-center justify-between">
                        <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <Book size={18} className="text-orange-500" /> Enrolled Subjects
                        </CardTitle>
                        <span className="text-[10px] font-semibold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                            {profile.subjectResponseDTOS.length} Subjects
                        </span>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                            {profile.subjectResponseDTOS.map((sub, i) => (
                                <SubjectChip
                                    key={sub.id || i}
                                    subjectName={sub.name}
                                    subjectCode={sub.code}
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
