import Link from 'next/link';
import Image from 'next/image';
import { api, imageUrl, BlogPost } from '@/lib/api';

async function getPosts(): Promise<BlogPost[]> {
  try {
    const { data } = await api.get('/blog');
    return data;
  } catch {
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <div className="eyebrow mb-3">Ideas & guides</div>
      <h1 className="font-display text-4xl md:text-5xl mb-16">Insights</h1>

      <div className="space-y-10">
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="group flex gap-6 items-start">
            {post.cover_image_path && (
              <div className="relative w-40 h-28 flex-shrink-0 bg-stoneDark dark:bg-white/5 overflow-hidden">
                <Image src={imageUrl(post.cover_image_path)!} alt={post.title} fill className="object-cover" />
              </div>
            )}
            <div>
              {post.category?.name && (
                <div className="text-xs text-brass font-semibold uppercase tracking-wide mb-1">{post.category.name}</div>
              )}
              <h2 className="font-display text-xl group-hover:text-brass transition-colors mb-1">{post.title}</h2>
              {post.excerpt && <p className="text-sm text-ink/60 dark:text-stone/60 line-clamp-2">{post.excerpt}</p>}
            </div>
          </Link>
        ))}
        {posts.length === 0 && <p className="text-ink/50 dark:text-stone/60">No articles published yet.</p>}
      </div>
    </div>
  );
}
