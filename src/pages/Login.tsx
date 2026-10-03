import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { Loader2, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { errorMessage } from '../utils/errors';
import { btnPrimary, inputClass, labelClass } from '../components/ui';

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').pipe(z.email('Please enter a valid email address')),
  password: z.string().min(1, 'Password is required'),
});
type LoginValues = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const [formError, setFormError] = useState<string | null>(null);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  if (isAuthenticated) return <Navigate to="/" replace />;

  const onSubmit = async (values: LoginValues) => {
    setFormError(null);
    try {
      const res = await api.post('/auth/staff/login', values);
      login(res.data.user, res.data.token);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      setFormError(errorMessage(err, 'Could not sign in. Please try again.'));
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950 p-4">
      <main className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent mb-2">FoodAdmin</h1>
          <p className="text-gray-400">Sign in to staff portal</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {formError && <div role="alert" className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">{formError}</div>}

          <div>
            <label htmlFor="email" className={labelClass}>Email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-500 pointer-events-none" aria-hidden="true" />
              <input id="email" type="email" autoComplete="username" aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined} {...register('email')} className={`${inputClass} pl-10`} placeholder="admin@example.com" />
            </div>
            {errors.email && <p id="email-error" className="mt-1 text-sm text-red-400">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className={labelClass}>Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500 pointer-events-none" aria-hidden="true" />
              <input id="password" type="password" autoComplete="current-password" aria-invalid={!!errors.password} aria-describedby={errors.password ? 'password-error' : undefined} {...register('password')} className={`${inputClass} pl-10`} placeholder="Your password" />
            </div>
            {errors.password && <p id="password-error" className="mt-1 text-sm text-red-400">{errors.password.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting} className={`${btnPrimary} w-full mt-2`}>
            {isSubmitting ? <><Loader2 className="animate-spin h-5 w-5" aria-hidden="true" /> Signing in...</> : 'Sign In'}
          </button>
        </form>
      </main>
    </div>
  );
};

export default Login;
