// app/page.tsx
'use client';

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SignInForm from './(auth)/sign-in/page';
import Image from 'next/image';

export default function SignInLanding() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // If a session exists, push to dashboard (so landing becomes sign-in when not authenticated)
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [status, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background font-sans transition-colors duration-300">
      <main className="flex w-full max-w-4xl flex-col items-center justify-center gap-8 rounded-2xl bg-white dark:bg-gray-900 p-10 shadow-xl transition-colors duration-300 sm:gap-8">
        <Image className="dark:invert" src="/next.svg" alt="logo" width={120} height={30} priority />

        <div className="w-full text-center">
          <h1 className="text-2xl font-bold mb-2 text-foreground dark:text-white">Sign in to NextEchoBox</h1>
          <p className="text-sm text-muted dark:text-gray-300 mb-6">
            Welcome back — sign in to continue.
          </p>

          <div className="mx-auto">
            <SignInForm />
          </div>

          <div className="mt-6 text-sm text-muted dark:text-gray-400">
            <p>
              Need an account?{' '}
              <a className="text-primary hover:underline" href="/sign-up">
                Create one
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
