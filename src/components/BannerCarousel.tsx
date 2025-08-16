import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Banner {
  id: string;
  message: string;
  course_slug: string;
  background_color: string;
  text_color: string;
  border_color: string;
  icon: string;
  is_active: boolean;
  data_imersao: string | null;
}

interface BannerCarouselProps {
  banners: Banner[];
}

export const BannerCarousel = ({ banners }: BannerCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!banners.length) return null;

  const singleBanner = banners.length === 1;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    }).toUpperCase().replace('.', '');
  };

  const calculateDaysUntil = (dateString: string | null) => {
    if (!dateString) return 0;
    const targetDate = new Date(dateString);
    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Auto-play functionality
  useEffect(() => {
    if (singleBanner) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length, singleBanner]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6">
      <div className="relative overflow-hidden">
        <div className="flex transition-transform duration-300 ease-in-out">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className={cn(
                "min-w-0 flex-shrink-0 px-6 py-4 rounded-lg border text-center transition-all duration-300",
                singleBanner ? "w-full" : "w-full"
              )}
              style={{
                backgroundColor: banner.background_color,
                color: banner.text_color,
                borderColor: banner.border_color,
                transform: singleBanner ? 'none' : `translateX(-${currentIndex * 100}%)`,
              }}
            >
              <div className="flex items-center justify-center gap-4">
                <span className="text-lg">{banner.icon}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">{banner.message}</span>
                  {banner.data_imersao && (
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-xs opacity-75">NOVO</div>
                        <div className="text-lg font-bold">{calculateDaysUntil(banner.data_imersao)}</div>
                        <div className="text-xs opacity-75">DIAS</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs opacity-75">{formatDate(banner.data_imersao)}</div>
                        <div className="text-xs opacity-75">PRÓXIMA TURMA</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs opacity-75">POÇOS DE CALDAS</div>
                        <div className="text-xs opacity-75">PRESENCIAL</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {!singleBanner && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
              onClick={goToNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {!singleBanner && (
        <div className="flex justify-center gap-2 mt-4">
          {banners.map((_, index) => (
            <button
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                index === currentIndex ? "bg-primary" : "bg-gray-300"
              )}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};