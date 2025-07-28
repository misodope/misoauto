'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/auth/login');
  }, [router]);

  return null;
}