import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import VisitorTracker from '@/components/VisitorTracker';
import ChatWidget from '@/components/ChatWidget';

// Every public page fetches its content from the Laravel API at request time
// (categories, projects, team, etc — all admin-managed and constantly
// changing). Without this, Next.js prerenders these pages once at build time
// and keeps serving that same frozen snapshot forever in production — admin
// edits would never show up publicly until the next full rebuild. Setting
// this here cascades to every page under this layout.
export const dynamic = 'force-dynamic';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <VisitorTracker />
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      <ChatWidget />
    </>
  );
}
