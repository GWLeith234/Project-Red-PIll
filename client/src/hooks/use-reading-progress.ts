import { useState, useEffect, useCallback, useRef } from "react";

export function useReadingProgress(contentRef: React.RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>(0);

  const updateProgress = useCallback(() => {
    if (!contentRef.current) return;

    const element = contentRef.current;
    const rect = element.getBoundingClientRect();
    const elementTop = rect.top + window.scrollY;
    const elementHeight = element.offsetHeight;
    const windowHeight = window.innerHeight;
    const scrollY = window.scrollY;

    const start = elementTop;
    const end = elementTop + elementHeight - windowHeight;

    if (end <= start) {
      setProgress(scrollY >= start ? 100 : 0);
      return;
    }

    const pct = Math.min(100, Math.max(0, ((scrollY - start) / (end - start)) * 100));
    setProgress(Math.round(pct));
  }, [contentRef]);

  useEffect(() => {
    const handleScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateProgress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    updateProgress();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [updateProgress]);

  return progress;
}
