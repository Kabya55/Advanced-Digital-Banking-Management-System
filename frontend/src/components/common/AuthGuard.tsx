'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCredentials, logout } from '@/store/slices/authSlice';
import { useGetMeQuery } from '@/store/api/apiSlice';
import { UserRole } from '@/types';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const { data: meData, error, isLoading } = useGetMeQuery(undefined, {
    skip: false,
  });

  useEffect(() => {
    if (meData?.user) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('bank_token') || '' : '';
      dispatch(setCredentials({ user: meData.user, token }));
    } else if (error) {
      dispatch(logout());
      router.push('/login');
    }
  }, [meData, error, dispatch, router]);

  useEffect(() => {
    if (!isLoading && !meData && !isAuthenticated) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('bank_token') : null;
      if (!token) {
        router.push('/login');
      }
    }
  }, [isLoading, meData, isAuthenticated, router]);

  // Role check
  useEffect(() => {
    if (user && allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(user.role)) {
        // Redirect to their default dashboard
        if (user.role === 'admin') router.push('/admin/dashboard');
        else if (user.role === 'staff') router.push('/staff/dashboard');
        else router.push('/customer/dashboard');
      }
    }
  }, [user, allowedRoles, router]);

  if (isLoading && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-sm text-slate-400 font-medium">Verifying banking authorization...</p>
      </div>
    );
  }

  return <>{children}</>;
}
