import Image from 'next/image';
import { notFound } from 'next/navigation';
import { api, imageUrl, BlogPost } from '@/lib/api';

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const { data } = await api.get(`/blog/${slug}`);
    return data;
  } catch (err) {
    console.error('Failed to load blog post:', err);
    return null;
  }
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <article className="max-w-3xl mx-auto px-6 py-20">
      {post.category?.name && (
        <div className="text-xs text-brass font-semibold uppercase tracking-wide mb-3">{post.category.name}</div>
      )}
      <h1 className="font-display text-4xl md:text-5xl mb-8">{post.title}</h1>

      {post.cover_image_path && (
        <div className="relative aspect-video bg-stoneDark mb-10">
          <Image src={imageUrl(post.cover_image_path)!} alt={post.title} fill className="object-cover" />
        </div>
      )}

      {post.content && (
        <div className="prose max-w-none text-ink/80" dangerouslySetInnerHTML={{ __html: post.content }} />
      )}
    </article>
  );
}
