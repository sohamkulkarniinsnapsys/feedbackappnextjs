// components/Navbar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export default function Navbar() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const displayName = user?.username ?? user?.email ?? 'User';

  return (
    <nav className="p-4 md:p-6 shadow-md bg-gray-900 text-white">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        <Link href="/" className="text-xl font-bold mb-4 md:mb-0">
          NextEchoBox
        </Link>

        <div className="flex items-center gap-4 w-full md:w-auto">
          {status === 'loading' ? (
            <span className="mr-4">Loading...</span>
          ) : session ? (
            <>
              <span className="mr-4">Welcome, {displayName}</span>
              <Button
                onClick={() => signOut({ callbackUrl: '/sign-in' })}
                className="cursor-pointer w-full md:w-auto bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Logout
              </Button>
            </>
          ) : (
            <Link href="/sign-in" className="w-full md:w-auto">
              <Button className="w-full md:w-auto bg-slate-100 text-black" variant="outline">
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
