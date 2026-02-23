'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { School, User, Mail, KeyRound, Building, FileImage, Loader2, Phone } from 'lucide-react';
import apiClient from '@/lib/axios';
import { showSuccess, showError, showLoading, dismissToast } from '@/lib/toastHelper';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function RegisterSchoolPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Form States
  const [schoolName, setSchoolName] = useState('');
  const [schoolAddress, setSchoolAddress] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [errors, setErrors] = useState({});

  // Step 1 Validation
  const validateStep1 = () => {
    const newErrors = {};
    if (!schoolName.trim()) newErrors.schoolName = 'School name is required.';
    if (!schoolAddress.trim()) newErrors.schoolAddress = 'School address is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    const newErrors = {};
    if (!fullName.trim()) newErrors.fullName = 'Full name is required.';
    if (!email || !/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Valid email required.';
    if (!phoneNumber || !/^\d{10}$/.test(phoneNumber))
      newErrors.phoneNumber = 'Phone number must be 10 digits.';
    if (!password || password.length < 5 || password.length > 15)
      newErrors.password = 'Password must be 5–15 characters.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation
  const handleNextStep = () => {
    if (validateStep1()) setStep(2);
  };

  // File Change
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showError('File is too large. Maximum size is 2MB.');
        e.target.value = '';
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setIsLoading(true);
    const toastId = showLoading('Creating your school…');

    const formData = new FormData();
    formData.append('schoolName', schoolName);
    formData.append('schoolAddress', schoolAddress);
    formData.append('adminFullName', fullName);
    formData.append('adminEmail', email);
    formData.append('adminPhoneNumber', phoneNumber);
    formData.append('adminPassword', password);
    if (logoFile) formData.append('logoFile', logoFile);

    try {
      await apiClient.post('/api/schools/register', formData);
      dismissToast(toastId);
      showSuccess('Registration complete. Redirecting to sign in…');

      setTimeout(() => {
        router.push('/admin/auth/admin-login');
      }, 1500);
    } catch (error) {
      console.error('Registration failed:', error);
      dismissToast(toastId);
      showError(error.customMessage || 'Registration failed. Please try again.', { id: toastId });
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-100">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-4">
            <div className="p-2 bg-white rounded-lg border border-slate-200">
              <School className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-xl font-mono font-bold text-slate-800">Manger</span>
          </Link>
          <h1 className="text-3xl font-mono font-bold text-slate-900">Onboard Your School</h1>
        </div>

        {/* Card */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
          {/* === Step 1 === */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-700 mb-1">Step 1 of 2: School Information</h2>
              <p className="text-sm text-slate-500 mb-6">Let's start with your school's profile.</p>

              <div className="space-y-5">
                {/* School Name */}
                <div>
                  <Label htmlFor="schoolName">School Name</Label>
                  <div className="relative mt-1">
                    <Building className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                    <Input
                      id="schoolName"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="e.g., Springdale High"
                      className={`pl-10 ${errors.schoolName ? 'border-red-500' : 'border-slate-300'}`}
                    />
                  </div>
                  {errors.schoolName && <p className="mt-1 text-sm text-red-600" role="alert">{errors.schoolName}</p>}
                </div>

                {/* School Address */}
                <div>
                  <Label htmlFor="schoolAddress">School Address</Label>
                  <div className="relative mt-1">
                    <Building className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                    <Input
                      id="schoolAddress"
                      value={schoolAddress}
                      onChange={(e) => setSchoolAddress(e.target.value)}
                      placeholder="e.g., 123 Education Lane"
                      className={`pl-10 ${errors.schoolAddress ? 'border-red-500' : 'border-slate-300'}`}
                    />
                  </div>
                  {errors.schoolAddress && <p className="mt-1 text-sm text-red-600" role="alert">{errors.schoolAddress}</p>}
                </div>

                {/* Logo Upload */}
                <div>
                  <Label htmlFor="logoFile">School Logo (Optional)</Label>
                  <div className="flex items-center gap-4 mt-1 flex-wrap">
                    <Avatar className="h-16 w-16 border bg-slate-50">
                      <AvatarImage src={logoPreview || ''} alt="Logo Preview" />
                      <AvatarFallback className="text-3xl"><FileImage /></AvatarFallback>
                    </Avatar>
                    <Input
                      id="logoFile"
                      type="file"
                      accept="image/png, image/jpeg"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </div>

                <Button onClick={handleNextStep} className="w-full text-base py-3 mt-4">
                  Next: Create Your Admin Account
                </Button>
              </div>
            </div>
          )}

          {/* === Step 2 === */}
          {step === 2 && (
            <form onSubmit={handleSubmit} noValidate>
              <h2 className="text-lg font-semibold text-slate-700 mb-1">Step 2 of 2: Admin Account</h2>
              <p className="text-sm text-slate-500 mb-6">
                This will be the primary administrator for {schoolName || 'your school'}.
              </p>

              <div className="space-y-5">
                {/* Full Name */}
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g., John Doe"
                      className={`pl-10 ${errors.fullName ? 'border-red-500' : 'border-slate-300'}`}
                    />
                  </div>
                  {errors.fullName && <p className="mt-1 text-sm text-red-600" role="alert">{errors.fullName}</p>}
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={`pl-10 ${errors.email ? 'border-red-500' : 'border-slate-300'}`}
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-sm text-red-600" role="alert">{errors.email}</p>}
                </div>

                {/* Phone */}
                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                    <Input
                      id="phoneNumber"
                      type="tel"
                      maxLength={10}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g., 9876543210"
                      className={`pl-10 ${errors.phoneNumber ? 'border-red-500' : 'border-slate-300'}`}
                    />
                  </div>
                  {errors.phoneNumber && <p className="mt-1 text-sm text-red-600" role="alert">{errors.phoneNumber}</p>}
                </div>

                {/* Password */}
                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative mt-1">
                    <KeyRound className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="5–15 characters"
                      className={`pl-10 ${errors.password ? 'border-red-500' : 'border-slate-300'}`}
                    />
                  </div>
                  {errors.password && <p className="mt-1 text-sm text-red-600" role="alert">{errors.password}</p>}
                </div>

                {/* ✅ Fixed Button Container */}
                <div className="flex flex-col sm:flex-row items-stretch gap-3 pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="w-full sm:w-1/2 text-base py-3"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:w-1/2 text-base py-3"
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : 'Complete Registration'}
                  </Button>
                </div>
              </div>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link href="/admin/auth/admin-login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
