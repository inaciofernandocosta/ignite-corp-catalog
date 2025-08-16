import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useBanners } from '@/hooks/useBanners';

export const BannerCarousel = () => {
  const { banners, loading, error } = useBanners();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-slide quando há múltiplos banners
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === banners.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); // Muda a cada 5 segundos

    return () => clearInterval(interval);
  }, [banners.length]);

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? banners.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex === banners.length - 1 ? 0 : currentIndex + 1);
  };

  if (loading || error || banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  return (
    <div className="w-full">
      <div 
        className="relative mx-auto max-w-4xl rounded-lg border px-6 py-4 shadow-sm transition-all duration-300"
        style={{
          backgroundColor: currentBanner.background_color,
          borderColor: currentBanner.border_color,
          color: currentBanner.text_color,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 text-white">
                <span className="text-lg">{currentBanner.icon}</span>
              </div>
              <div>
                <div className="text-sm font-medium opacity-90">
                  {currentBanner.message}
                </div>
              </div>
            </div>
          </div>

          {/* Controles do carousel - mostrar apenas se há múltiplos banners */}
          {banners.length > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevious}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-black/10 hover:bg-black/20 transition-colors"
                aria-label="Banner anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              {/* Indicadores de pontos */}
              <div className="flex gap-1">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-2 w-2 rounded-full transition-opacity ${
                      index === currentIndex ? 'bg-current opacity-100' : 'bg-current opacity-30'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={goToNext}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-black/10 hover:bg-black/20 transition-colors"
                aria-label="Próximo banner"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};