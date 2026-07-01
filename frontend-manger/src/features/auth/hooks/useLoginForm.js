import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { showError, showSuccess } from '@/lib/toastHelper';
import { useFormValidation } from './useFormValidation';

export function useLoginForm({ apiInstance, loginFn, roleConfig }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Rules: Students don't check minLength; admins/teachers require min 5 chars.
  const validationRules = {
    email: {
      required: true,
      requiredMessage: 'Email address is required.',
      pattern: /\S+@\S+\.\S+/,
      patternMessage: 'Please enter a valid email address.',
    },
    password: {
      required: true,
      requiredMessage: 'Password is required.',
      ...(roleConfig.accentColor !== 'orange' && {
        minLength: 5,
        minLengthMessage: 'Password must be at least 5 characters long.',
      }),
    },
  };

  const { errors, validate, clearErrors } = useFormValidation(validationRules);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate({ email, password })) {
      showError('Please correct the highlighted fields.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiInstance.client.post(`${roleConfig.apiPrefix}/login`, {
        email,
        password,
      });

      const { accessToken } = response.data;
      loginFn(accessToken);

      showSuccess('Signed in successfully. Redirecting…');

      setTimeout(() => {
        router.push(roleConfig.dashboardPath);
      }, 800);
    } catch (error) {
      console.error('Login failed:', error.customMessage);
      const message = error.customMessage || 'Login failed. Please try again.';
      setServerError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    errors,
    serverError,
    isLoading,
    handleSubmit,
  };
}
