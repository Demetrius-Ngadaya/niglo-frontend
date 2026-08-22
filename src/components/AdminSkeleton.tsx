import { Skeleton } from './Skeleton';

// A single placeholder row matching the horizontal "thumbnail + text +
// actions" shape used by almost every admin list screen (Blog, Hero Slides,
// Portfolio, Rentals, Service Sliders, Services, Videos, Testimonials).
function AdminRow({ withThumb = true }: { withThumb?: boolean }) {
  return (
    <div className="flex items-center gap-4 border border-ink/10 dark:border-stone/10 bg-white/40 dark:bg-white/5 p-3">
      {withThumb && <Skeleton className="w-16 h-14 flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <Skeleton className="h-4 w-1/3 mb-2" />
        <Skeleton className="h-3 w-1/5" />
      </div>
      <Skeleton className="h-4 w-10 flex-shrink-0" />
      <Skeleton className="h-4 w-10 flex-shrink-0" />
    </div>
  );
}

// The most common admin loading state — a vertical stack of placeholder
// rows. Matches the majority of admin list/CRUD screens.
export function AdminListSkeleton({ rows = 5, withThumb = true }: { rows?: number; withThumb?: boolean }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <AdminRow key={i} withThumb={withThumb} />
      ))}
    </div>
  );
}

// For screens whose rows are taller bordered blocks rather than a tight
// single line (Quotation Requests, Rental Requests, FAQs) — same idea, a
// bit more vertical room per row.
export function AdminBlockListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border border-ink/10 dark:border-stone/10 bg-white/40 dark:bg-white/5 p-4">
          <Skeleton className="h-4 w-1/2 mb-3" />
          <Skeleton className="h-3 w-full mb-1" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

// For grid-based admin screens (Gallery, Team) — a grid of card-shaped
// placeholders instead of rows.
export function AdminCardGridSkeleton({ count = 6, columns = 3 }: { count?: number; columns?: 2 | 3 }) {
  const colClass = columns === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3';
  return (
    <div className={`grid ${colClass} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-ink/10 dark:border-stone/10 bg-white/40 dark:bg-white/5 p-4">
          <Skeleton className="w-full h-32 mb-3" />
          <Skeleton className="h-4 w-2/3 mb-2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

// For the Dashboard and Visitors stat-card rows.
export function AdminStatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-ink/10 dark:border-stone/10 bg-white/40 dark:bg-white/5 p-6">
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}
