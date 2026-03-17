'use client';
import { classroomDisplayName } from '@/lib/classroomDisplayName';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  Award,
  BookOpen,
  Briefcase,
  Bus,
  Calendar,
  CheckCircle2,
  ChevronDown,
  DollarSign,
  GraduationCap,
  Heart,
  Home,
  Loader2,
  Mail,
  MapPin,
  PauseCircle,
  Phone,
  School,
  TrendingUp,
  User,
  Users,
  XCircle
} from 'lucide-react';
import { useState } from 'react';

const InfoItem = ({ icon: Icon, label, value, iconColor = 'text-slate-400' }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className={`mt-0.5 p-1.5 rounded-md bg-slate-50 ${iconColor}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500 mb-0.5">{label}</p>
        <p className="text-sm text-slate-900 break-words">{value}</p>
      </div>
    </div>
  );
};

const SectionCard = ({ icon: Icon, title, children, className = '' }) => (
  <Card className={`border-slate-200 shadow-sm ${className}`}>
    <CardHeader className="py-4 border-b border-slate-100 bg-slate-50/50">
      <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-800">
        <Icon className="h-4 w-4 text-slate-500" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-4">{children}</CardContent>
  </Card>
);

const EmptyState = ({ icon: Icon, text }) => (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    <Icon className="h-8 w-8 text-slate-300 mb-3" />
    <p className="text-slate-500 text-sm">{text}</p>
  </div>
);

function gradeColor(grade) {
  const colors = {
    'A+': 'bg-emerald-100 text-emerald-700',
    'A': 'bg-green-100 text-green-700',
    'B': 'bg-blue-100 text-blue-700',
    'C': 'bg-amber-100 text-amber-700',
    'D': 'bg-orange-100 text-orange-700',
    'F': 'bg-red-100 text-red-700',
  };
  return colors[grade] || 'bg-slate-100 text-slate-600';
}

export default function StudentProfile({
  student,
  examResults = [],
  attendanceSummary,
  showAttendance = false,
  loadingResults = false,
}) {
  const [expandedExam, setExpandedExam] = useState(null);
  const [showAllExams, setShowAllExams] = useState(false);
  const EXAMS_INITIAL_SHOW = 4;

  if (!student) return null;

  const {
    firstName,
    lastName,
    email,
    phoneNumber,
    profilePictureUrl,
    rollNo,
    admissionNo,
    academicYearName,
    classroomResponseDTO,
    subjectResponseDTOS = [],
    status,
    fatherName,
    motherName,
    guardianName,
    parentPhonePrimary,
    parentPhoneSecondary,
    parentEmail,
    parentOccupation,
    annualIncome,
    fullAddress,
    city,
    state,
    pincode,
    medicalConditions,
    allergies,
    emergencyContactName,
    emergencyContactNumber,
    previousSchoolName,
    previousClass,
    admissionDate,
    transportRequired,
    hostelRequired,
    feeCategory,
    gender,
  } = student;

  const hasParentInfo = fatherName || motherName || guardianName || parentPhonePrimary || parentPhoneSecondary || parentEmail || parentOccupation || annualIncome;
  const hasAddress = fullAddress || city || state || pincode;
  const hasEmergency = emergencyContactName || emergencyContactNumber;
  const hasAcademic = previousSchoolName || previousClass || admissionDate || feeCategory || transportRequired || hostelRequired;
  const hasMedical = medicalConditions || allergies;
  const attendancePercentage = attendanceSummary?.attendancePercentage ?? 0;
  const displayedExams = showAllExams ? examResults : examResults.slice(0, EXAMS_INITIAL_SHOW);
  const metaChips = [
    rollNo ? `Roll No: ${rollNo}` : null,
    admissionNo ? `Admission: ${admissionNo}` : null,
    academicYearName ? `Year: ${academicYearName}` : null,
  ].filter(Boolean);

  const getStatusBadge = (st) => {
    switch (st) {
      case 'ACTIVE':
        return <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200"><CheckCircle2 className="h-3 w-3 mr-1" /> Active</Badge>;
      case 'SUSPENDED':
        return <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-200"><PauseCircle className="h-3 w-3 mr-1" /> Suspended</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 border-slate-200"><XCircle className="h-3 w-3 mr-1" /> Inactive</Badge>;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="w-full lg:w-1/3 space-y-6">
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <div className={`h-2 w-full ${status === 'ACTIVE' ? 'bg-indigo-600' : status === 'SUSPENDED' ? 'bg-amber-500' : 'bg-slate-300'}`} />
          <CardContent className="pt-8 pb-6 px-6 flex flex-col items-center text-center bg-gradient-to-b from-white to-slate-50/70">
            <div className="relative mb-4">
              <Avatar className="h-28 w-28 ring-4 ring-white shadow-md">
                <AvatarImage src={profilePictureUrl ? `http://localhost:8080/api/files/students/${profilePictureUrl}` : ''} className="object-cover" />
                <AvatarFallback className="text-3xl font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                  {firstName?.[0]}{lastName?.[0]}
                </AvatarFallback>
              </Avatar>
            </div>

            <h1 className="text-xl font-bold text-slate-900 mb-1">{firstName} {lastName}</h1>
            <div className="flex items-center gap-2 mb-4 flex-wrap justify-center">
              {metaChips.map((chip) => (
                <span key={chip} className="text-xs font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                  {chip}
                </span>
              ))}
              {getStatusBadge(status)}
            </div>

            <div className="w-full space-y-3 text-left border-t border-slate-100 pt-5 mt-2">
              {email && (
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="truncate">{email}</span>
                </div>
              )}
              {phoneNumber && (
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span>{phoneNumber}</span>
                </div>
              )}
              {classroomResponseDTO && (
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <GraduationCap className="h-4 w-4 text-slate-400" />
                  <span className="font-medium text-slate-800">{classroomDisplayName(classroomResponseDTO)}</span>
                </div>
              )}
              {gender && (
                <div className="flex items-center gap-3 text-sm text-slate-600 capitalize">
                  <User className="h-4 w-4 text-slate-400" />
                  <span>{gender.toLowerCase()}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {classroomResponseDTO && (
            <Card className="border-slate-200 shadow-sm bg-indigo-50/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Subjects</p>
                  <p className="text-2xl font-bold text-slate-900">{subjectResponseDTOS.length}</p>
                </div>
                <BookOpen className="h-8 w-8 text-indigo-200" />
              </CardContent>
            </Card>
          )}
          <Card className="border-slate-200 shadow-sm bg-slate-50/80">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Academic Year</p>
                <p className="text-lg font-bold text-slate-900">{academicYearName || 'Not assigned'}</p>
              </div>
              <GraduationCap className="h-8 w-8 text-slate-300" />
            </CardContent>
          </Card>
        </div>

        {showAttendance && attendanceSummary && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="py-4 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Calendar className="h-4 w-4 text-slate-500" />
                Attendance Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900 flex items-center gap-1 justify-center">{attendancePercentage}%</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">Overall</p>
                </div>
                <div className="h-10 w-px bg-slate-200 mx-2"></div>
                <div className="text-center">
                  <p className="text-xl font-bold text-emerald-600">{attendanceSummary.daysPresent}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">Present</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-rose-500">{attendanceSummary.daysAbsent}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">Absent</p>
                </div>
              </div>

              <div className="w-full bg-slate-100 rounded-full h-2 mb-1.5 overflow-hidden">
                <div className={`h-2 rounded-full ${attendancePercentage >= 75 ? 'bg-emerald-500' : attendancePercentage >= 60 ? 'bg-amber-400' : 'bg-red-500'}`} style={{ width: `${Math.min(attendancePercentage, 100)}%` }}></div>
              </div>
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>{attendanceSummary.daysPresent} / {attendanceSummary.totalWorkingDays} Days</span>
                <span>Target: 75%</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="w-full lg:w-2/3">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start border-b border-slate-200 bg-transparent rounded-none h-auto p-0 mb-6 space-x-6 overflow-x-auto">
            <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3 text-sm font-medium">
              Overview
            </TabsTrigger>
            <TabsTrigger value="academic" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3 text-sm font-medium">
              Academic & Medical
            </TabsTrigger>
            <TabsTrigger value="subjects" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3 text-sm font-medium flex items-center gap-2">
              Subjects <Badge variant="secondary" className="bg-slate-100">{subjectResponseDTOS.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="exams" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3 text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5" /> Results
              {examResults.length > 0 && <Badge variant="secondary" className="bg-indigo-50 text-indigo-600">{examResults.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 focus-visible:outline-none">
            <SectionCard icon={Users} title="Family & Guardian">
              {hasParentInfo ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                  <InfoItem icon={Users} label="Father" value={fatherName} />
                  <InfoItem icon={Users} label="Mother" value={motherName} />
                  <InfoItem icon={Users} label="Guardian" value={guardianName} />
                  <InfoItem icon={Briefcase} label="Occupation" value={parentOccupation} />
                  <InfoItem icon={Phone} label="Primary Phone" value={parentPhonePrimary} />
                  <InfoItem icon={Phone} label="Secondary Phone" value={parentPhoneSecondary} />
                  <InfoItem icon={Mail} label="Parent Email" value={parentEmail} />
                  <InfoItem icon={DollarSign} label="Annual Income" value={annualIncome ? `Rs ${annualIncome}` : null} />
                </div>
              ) : (
                <EmptyState icon={Users} text="No family information provided." />
              )}
            </SectionCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SectionCard icon={MapPin} title="Address">
                {hasAddress ? (
                  <div className="space-y-4">
                    {fullAddress && (
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1">Full Address</p>
                        <p className="text-sm text-slate-800 leading-relaxed">{fullAddress}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      {city && <div><p className="text-xs font-medium text-slate-500 mb-1">City</p><p className="text-sm text-slate-800">{city}</p></div>}
                      {state && <div><p className="text-xs font-medium text-slate-500 mb-1">State</p><p className="text-sm text-slate-800">{state}</p></div>}
                      {pincode && <div><p className="text-xs font-medium text-slate-500 mb-1">Pincode</p><p className="text-sm text-slate-800 font-mono">{pincode}</p></div>}
                    </div>
                  </div>
                ) : (
                  <EmptyState icon={MapPin} text="No address on file." />
                )}
              </SectionCard>

              <SectionCard icon={AlertCircle} title="Emergency Contact">
                {hasEmergency ? (
                  <div className="space-y-2">
                    <InfoItem icon={Users} label="Contact Name" value={emergencyContactName} iconColor="text-red-500" />
                    <InfoItem icon={Phone} label="Contact Number" value={emergencyContactNumber} iconColor="text-red-500" />
                  </div>
                ) : (
                  <EmptyState icon={AlertCircle} text="No emergency contact listed." />
                )}
              </SectionCard>
            </div>
          </TabsContent>

          <TabsContent value="academic" className="space-y-6 focus-visible:outline-none">
            <SectionCard icon={GraduationCap} title="Academic History & Details">
              {hasAcademic ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                  <InfoItem icon={School} label="Previous School" value={previousSchoolName} />
                  <InfoItem icon={BookOpen} label="Previous Class" value={previousClass} />
                  <InfoItem icon={Calendar} label="Admission Date" value={admissionDate} />
                  <InfoItem icon={Briefcase} label="Fee Category" value={feeCategory} />

                  {(transportRequired || hostelRequired) && (
                    <div className="md:col-span-2 flex gap-3 pt-4 border-t border-slate-100 mt-2">
                      {transportRequired && <Badge variant="outline" className="text-indigo-700 bg-indigo-50 border-indigo-200"><Bus className="h-3 w-3 mr-1.5" /> Transport Required</Badge>}
                      {hostelRequired && <Badge variant="outline" className="text-violet-700 bg-violet-50 border-violet-200"><Home className="h-3 w-3 mr-1.5" /> Hostel Required</Badge>}
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState icon={GraduationCap} text="No academic history available." />
              )}
            </SectionCard>

            <SectionCard icon={Heart} title="Health & Medical">
              {hasMedical ? (
                <div className="space-y-4">
                  {medicalConditions && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1.5"><Heart className="h-3 w-3 text-pink-500" /> Medical Conditions</p>
                      <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-md border border-slate-100">{medicalConditions}</p>
                    </div>
                  )}
                  {allergies && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1.5"><Heart className="h-3 w-3 text-pink-500" /> Allergies</p>
                      <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-md border border-slate-100">{allergies}</p>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState icon={Heart} text="No medical records found." />
              )}
            </SectionCard>
          </TabsContent>

          <TabsContent value="subjects" className="focus-visible:outline-none">
            <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
              {subjectResponseDTOS.length === 0 ? (
                <EmptyState icon={BookOpen} text="No subjects assigned for this student." />
              ) : (
                <div className="divide-y divide-slate-100">
                  {subjectResponseDTOS.map((subject) => (
                    <div key={subject.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                      <div>
                        <h4 className="font-semibold text-slate-900">{subject.name}</h4>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{subject.code}</p>
                      </div>
                      <Badge variant="secondary" className={subject.mandatory ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}>
                        {subject.mandatory ? 'Core' : 'Elective'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="exams" className="focus-visible:outline-none">
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              {loadingResults ? (
                <div className="p-12 flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                </div>
              ) : examResults.length === 0 ? (
                <EmptyState icon={Award} text="No exam results found for this student." />
              ) : (
                <div className="divide-y divide-slate-100">
                  {displayedExams.map((exam) => {
                    const isExpanded = expandedExam === exam.examId;
                    return (
                      <div key={exam.examId}>
                        <button onClick={() => setExpandedExam(isExpanded ? null : exam.examId)} className="w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h4 className="font-bold text-slate-800 truncate">{exam.examName}</h4>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${exam.examStatus === 'Completed'
                                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                  : 'bg-blue-50 text-blue-600 border border-blue-200'
                                  }`}>{exam.examStatus}</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {exam.academicYearName || 'Academic year not set'}</span>
                                {exam.examType && <span>{exam.examType}</span>}
                                {exam.classroomName && <span>{exam.classroomName}</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 ml-3">
                              <div className="text-right">
                                <p className="text-lg font-bold text-slate-800">{exam.percentage}%</p>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${gradeColor(exam.overallGrade)}`}>{exam.overallGrade || '-'}</span>
                              </div>
                              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="px-5 pb-4 animate-in fade-in duration-150">
                            <div className="bg-slate-50 rounded-lg border border-slate-100 overflow-hidden">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100">
                                    <th className="px-4 py-2.5 text-left font-semibold">Subject</th>
                                    <th className="px-4 py-2.5 text-right font-semibold">Marks</th>
                                    <th className="px-4 py-2.5 text-center font-semibold">Grade</th>
                                    <th className="px-4 py-2.5 text-right font-semibold">%</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {exam.subjectMarks.map((subjectMark, idx) => (
                                    <tr key={idx} className="hover:bg-white transition-colors">
                                      <td className="px-4 py-2.5 font-medium text-slate-700">{subjectMark.subjectName}</td>
                                      <td className="px-4 py-2.5 text-right text-slate-600">
                                        <span className="font-semibold">{subjectMark.marksObtained}</span>
                                        <span className="text-slate-400"> / {subjectMark.maxMarks}</span>
                                      </td>
                                      <td className="px-4 py-2.5 text-center">
                                        <span className={`inline-flex items-center justify-center w-8 h-6 text-[10px] font-bold rounded ${gradeColor(subjectMark.grade)}`}>{subjectMark.grade || '-'}</span>
                                      </td>
                                      <td className="px-4 py-2.5 text-right font-semibold text-slate-700">{subjectMark.percentage}%</td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="bg-slate-100/50 font-semibold text-slate-800">
                                    <td className="px-4 py-2.5">Total</td>
                                    <td className="px-4 py-2.5 text-right">{exam.totalObtained} / {exam.totalMaxMarks}</td>
                                    <td className="px-4 py-2.5 text-center">
                                      <span className={`inline-flex items-center justify-center w-8 h-6 text-[10px] font-bold rounded ${gradeColor(exam.overallGrade)}`}>{exam.overallGrade || '-'}</span>
                                    </td>
                                    <td className="px-4 py-2.5 text-right">{exam.percentage}%</td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {!showAllExams && examResults.length > EXAMS_INITIAL_SHOW && (
                <div className="p-4 border-t border-slate-100 flex justify-center">
                  <button onClick={() => setShowAllExams(true)} className="px-6 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200">
                    See All Results ({examResults.length})
                  </button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
