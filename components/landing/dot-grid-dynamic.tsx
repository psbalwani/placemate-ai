'use client';

import dynamic from 'next/dynamic';

const DotGrid = dynamic(() => import('./dot-grid'), { ssr: false, loading: () => null });

export { DotGrid };
