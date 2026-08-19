'use client';

import { usePathname } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';

// The admin panel is intentionally a completely separate shell from the public
// site — no SiteHeader/SiteFooter here (those only wrap the (public) route
// group). The login page is the one exception: it renders on its own, with no
// sidebar, since there's nothing to navigate to before signing in.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
    return <div className="min-h-screen bg-stone">{children}</div>;
  }

  return (
    <div className="flex min-h-screen bg-stone">
      <AdminSidebar />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
