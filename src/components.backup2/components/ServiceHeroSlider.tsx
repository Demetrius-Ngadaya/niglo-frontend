'use client';

import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import { imageUrl } from '@/lib/api';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

type Slide = { id: number; image_path: string; title?: string | null };

export default function ServiceHeroSlider({ slides }: { slides: Slide[] }) {
  if (slides.length === 0) return null;

  return (
    <div className="relative bg-ink">
      <Swiper
        modules={[Autoplay, Navigation, Pagination]}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        loop={slides.length > 1}
        className="service-hero-swiper"
      >
        {slides.map((slide, i) => (
          <SwiperSlide key={slide.id}>
            <div className="relative w-full h-[260px] sm:h-[380px] lg:h-[480px] flex items-center justify-center bg-ink">
              <Image
                src={imageUrl(slide.image_path)!}
                alt={slide.title || 'NIGLOY service'}
                fill
                priority={i === 0}
                loading={i === 0 ? 'eager' : 'lazy'}
                sizes="100vw"
                className="object-contain"
              />
              {slide.title && (
                <div className="absolute bottom-6 left-0 right-0 text-center px-6">
                  <span className="inline-block bg-ink/70 backdrop-blur-sm text-stone font-display text-lg sm:text-2xl px-6 py-2">
                    {slide.title}
                  </span>
                </div>
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <style jsx global>{`
        .service-hero-swiper .swiper-button-next,
        .service-hero-swiper .swiper-button-prev {
          color: #d9a857;
        }
        .service-hero-swiper .swiper-pagination-bullet-active {
          background: #b8863b;
        }
      `}</style>
    </div>
  );
}
