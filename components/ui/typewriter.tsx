'use client';

import { useState, useEffect, useRef } from 'react';

interface TypewriterProps {
  text: string;
  speed?: number; // ms per character
  onComplete?: () => void;
  className?: string;
  cursor?: boolean;
}

export function Typewriter({
  text,
  speed = 18,
  onComplete,
  className,
  cursor = true,
}: TypewriterProps) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const prevTextRef = useRef('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    if (text === prevTextRef.current) return;
    prevTextRef.current = text;
    setDisplayed('');
    setDone(false);
    indexRef.current = 0;

    function tick() {
      if (indexRef.current >= text.length) {
        setDone(true);
        onComplete?.();
        return;
      }
      indexRef.current += 1;
      setDisplayed(text.slice(0, indexRef.current));
      timerRef.current = setTimeout(tick, speed);
    }

    timerRef.current = setTimeout(tick, speed);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [text, speed, onComplete]);

  return (
    <span className={className}>
      {displayed}
      {cursor && !done && (
        <span
          className="inline-block w-0.5 h-4 bg-current align-middle ml-0.5 animate-pulse"
          aria-hidden="true"
        />
      )}
    </span>
  );
}
