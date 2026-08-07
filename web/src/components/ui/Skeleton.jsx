import React from 'react';
import { cn } from '@/utils/cn';

const Skeleton = ({ className, variant = 'default', count = 1 }) => {
  const variants = {
    default: 'rounded-lg',
    circular: 'rounded-full',
    text: 'rounded h-4',
    card: 'rounded-xl h-32',
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'shimmer',
            variants[variant],
            className
          )}
        />
      ))}
    </>
  );
};

// Pre-built skeleton variants
export const SkeletonCard = () => (
  <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-5 space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-6 w-16 rounded-md" />
    </div>
    <Skeleton className="h-8 w-32" />
    <div className="flex gap-2">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-3 w-20" />
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div className="space-y-2">
    <Skeleton className="h-10 w-full rounded-lg" />
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} className="h-12 w-full rounded-lg" />
    ))}
  </div>
);

export const SkeletonChart = () => (
  <Skeleton className="h-64 w-full rounded-xl" />
);

export default Skeleton;