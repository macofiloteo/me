'use client';

import React from 'react';
import { useVisitorTracker } from '@hooks';

export default function PostLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useVisitorTracker();
  return (
    <>
      {children}
    </>
  );
}
