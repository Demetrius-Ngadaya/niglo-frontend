'use client';

import { useState } from 'react';
import { imageUrl, TeamMember } from '@/lib/api';
import ImageLightbox from '@/components/ImageLightbox';
import Reveal from '@/components/Reveal';

export default function TeamSection({ members }: { members: TeamMember[] }) {
  const [lightboxMember, setLightboxMember] = useState<TeamMember | null>(null);

  if (members.length === 0) return null;

  return (
    <>
      <section className="max-w-6xl mx-auto px-6 py-20">
        <Reveal>
          <div className="eyebrow mb-3">The people behind NIGLOY</div>
          <h2 className="font-display text-3xl md:text-4xl mb-10">Meet the Team</h2>
        </Reveal>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
          {members.map((member, i) => (
            <Reveal key={member.id} delay={i * 0.06} y={16}>
              <div className="text-center">
                <button
                  onClick={() => member.photo_path && setLightboxMember(member)}
                  className="group relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden flex items-center justify-center ring-2 ring-transparent hover:ring-brass transition-all duration-300 hover:-translate-y-1"
                >
                  {member.photo_path ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl(member.photo_path)!}
                      alt={member.full_name}
                      className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-stoneDark dark:bg-white/5 flex items-center justify-center font-display text-2xl text-ink/30 dark:text-stone/30">
                      {member.full_name.charAt(0)}
                    </div>
                  )}
                </button>
                <div className="font-display text-base">{member.full_name}</div>
                <div className="text-xs text-ink/50 dark:text-stone/50">{member.position}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {lightboxMember?.photo_path && (
        <ImageLightbox
          images={[{ image_path: lightboxMember.photo_path, caption: lightboxMember.full_name }]}
          startIndex={0}
          title={`${lightboxMember.full_name} — ${lightboxMember.position}`}
          onClose={() => setLightboxMember(null)}
        />
      )}
    </>
  );
}
