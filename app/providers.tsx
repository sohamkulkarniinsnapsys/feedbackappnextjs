// app/providers.tsx
'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';

type Props = {
  children: React.ReactNode;
  session?: any;
};

export default function Providers({ children, session }: Props) {
  // Keep this small: wraps the app in next-auth's SessionProvider
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
