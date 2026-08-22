// The basic shimmering placeholder block used everywhere below. Deliberately
// a plain server-renderable div with Tailwind's built-in animate-pulse — no
// client JS needed, so it can appear the instant the page starts loading,
// before any JavaScript has even had a chance to run.
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-ink/10 dark:bg-stone/10 rounded ${className}`} />;
}

// A grid of placeholder cards — image block + a couple of text lines —
// matching the shape of Services/Portfolio/Gallery/Rentals/Videos grids.
export function CardGridSkeleton({ count = 6, columns = 3 }: { count?: number; columns?: 2 | 3 }) {
  const colClass = columns === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3';
  return (
    <div className={`grid ${colClass} gap-6`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <Skeleton className="aspect-square mb-3 w-full" />
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

// A vertical list of items with a small thumbnail — matches the Blog listing.
export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-10">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-6 items-start">
          <Skeleton className="w-40 h-28 flex-shrink-0" />
          <div className="flex-1">
            <Skeleton className="h-3 w-24 mb-3" />
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// A single large hero image + title + a few lines — matches Portfolio/
// Gallery/Blog/Highlights detail pages.
export function DetailSkeleton() {
  return (
    <div>
      <Skeleton className="w-full aspect-video mb-8" />
      <Skeleton className="h-4 w-32 mb-4" />
      <Skeleton className="h-10 w-2/3 mb-6" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

// A vertical stack of label+input shaped blocks — matches Contact/
// Start-a-Project/Request-Equipment forms.
export function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div className="space-y-5 max-w-xl">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-11 w-full" />
        </div>
      ))}
      <Skeleton className="h-11 w-40 mt-2" />
    </div>
  );
}

// Just a heading + a few paragraph lines — matches simpler text pages like
// Track Request's initial state.
export function TextBlockSkeleton() {
  return (
    <div>
      <Skeleton className="h-4 w-32 mb-4" />
      <Skeleton className="h-10 w-1/2 mb-8" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-5/6 mb-2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}
