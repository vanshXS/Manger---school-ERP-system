'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import teacherApiClient from '@/lib/teacherAxios';
import {
    AlertTriangle, Briefcase, Building2, Calendar, GraduationCap,
    Mail, MapPin, Phone, RefreshCw, School, Shield, User, Users
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

/* ── Assignment Chip ── */
const AssignmentChip = ({ className: cls, subjectName }) => (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
        <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
        <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{subjectName}</p>
            <p className="text-[11px] text-slate-500 truncate">{cls}</p>
        </div>
    </div>
);

/* ── MAIN ── */
export default function TeacherProfilePage() {
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const isMounted = useRef(false);

    const fetchProfile = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await teacherApiClient.get('/api/teacher/profile');
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
                    <Button className="w-full h-9" onClick={fetchProfile}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                    </Button>
                </div>
            </div>
        );
    }

    if (!profile) return null;

    const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Teacher';
    const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6 animate-in fade-in duration-300">

            {/* ── HERO CARD ── */}
            <Card className="rounded-2xl overflow-hidden border-slate-200/80 shadow-sm">
                <div className="h-24 sm:h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600" />
                <CardContent className="p-4 sm:p-6 -mt-12 sm:-mt-14">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
                        <Avatar className="h-20 w-20 sm:h-24 sm:w-24 ring-4 ring-white shadow-lg">
                            {profile.profilePictureUrl && (
                                <AvatarImage src={`http://localhost:8080/api/files/teachers/${profile.profilePictureUrl}`} alt={fullName} />
                            )}
                            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-xl sm:text-2xl font-bold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="text-center sm:text-left flex-1 min-w-0">
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{fullName}</h1>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1.5">
                                {profile.schoolName && (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                                        <School size={12} /> {profile.schoolName}
                                    </span>
                                )}
                                {profile.employmentType && (
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                                        <Briefcase size={12} /> {profile.employmentType}
                                    </span>
                                )}
                                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${profile.active
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-red-50 text-red-700 border border-red-200'
                                    }`}>
                                    <Shield size={12} /> {profile.active ? 'Active' : 'Inactive'}
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
                            <User size={18} className="text-blue-500" /> Personal Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 divide-y divide-slate-100">
                        <InfoRow icon={Mail} label="Email" value={profile.email} colorClass="text-blue-500" />
                        <InfoRow icon={Phone} label="Phone" value={profile.phoneNumber} colorClass="text-emerald-500" />
                        <InfoRow icon={User} label="Gender" value={profile.gender} colorClass="text-purple-500" />
                        <InfoRow icon={Calendar} label="Joined" value={profile.joinDate} colorClass="text-amber-500" />
                    </CardContent>
                </Card>

                {/* ── QUALIFICATIONS ── */}
                <Card className="rounded-xl shadow-sm border-slate-200/80">
                    <CardHeader className="pb-2 p-4">
                        <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <GraduationCap size={18} className="text-indigo-500" /> Qualifications
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 divide-y divide-slate-100">
                        <InfoRow icon={GraduationCap} label="Qualification" value={profile.qualification} colorClass="text-indigo-500" />
                        <InfoRow icon={Briefcase} label="Specialization" value={profile.specialization} colorClass="text-teal-500" />
                        <InfoRow icon={Calendar} label="Years of Experience" value={profile.yearsOfExperience != null ? `${profile.yearsOfExperience} years` : null} colorClass="text-orange-500" />
                    </CardContent>
                </Card>

                {/* ── ADDRESS ── */}
                <Card className="rounded-xl shadow-sm border-slate-200/80">
                    <CardHeader className="pb-2 p-4">
                        <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <MapPin size={18} className="text-rose-500" /> Address
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 divide-y divide-slate-100">
                        <InfoRow icon={MapPin} label="Full Address" value={profile.fullAddress} colorClass="text-rose-500" />
                        <InfoRow icon={Building2} label="City" value={profile.city} colorClass="text-sky-500" />
                        <InfoRow icon={MapPin} label="State" value={profile.state} colorClass="text-violet-500" />
                        <InfoRow icon={MapPin} label="Pincode" value={profile.pincode} colorClass="text-slate-500" />
                    </CardContent>
                </Card>

                {/* ── EMERGENCY CONTACT ── */}
                <Card className="rounded-xl shadow-sm border-slate-200/80">
                    <CardHeader className="pb-2 p-4">
                        <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <Phone size={18} className="text-red-500" /> Emergency Contact
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 divide-y divide-slate-100">
                        <InfoRow icon={User} label="Contact Name" value={profile.emergencyContactName} colorClass="text-red-500" />
                        <InfoRow icon={Phone} label="Contact Number" value={profile.emergencyContactNumber} colorClass="text-red-400" />
                    </CardContent>
                </Card>
            </div>

            {/* ── ASSIGNED CLASSES ── */}
            {profile.assignedClassrooms && profile.assignedClassrooms.length > 0 && (
                <Card className="rounded-xl shadow-sm border-slate-200/80">
                    <CardHeader className="pb-2 p-4 flex flex-row items-center justify-between">
                        <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <Users size={18} className="text-blue-500" /> Assigned Classes & Subjects
                        </CardTitle>
                        <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                            {profile.assignedClassrooms.length} Assignments
                        </span>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {profile.assignedClassrooms.map((ac, i) => (
                                <AssignmentChip
                                    key={ac.assignmentId || i}
                                    className={ac.className}
                                    subjectName={ac.subjectName}
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
