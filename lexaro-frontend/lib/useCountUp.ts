'use client';

import { useEffect, useRef, useState } from 'react';

export default function useCountUp(target: number, durationMs = 800) {
    const [val, setVal] = useState(0);
    const raf = useRef<number | null>(null);
    const start = useRef<number | null>(null);
    const from = useRef<number>(0);

    useEffect(() => {
        if (!Number.isFinite(target)) {
            setVal(0);
            return;
        }
        // start from previous displayed value
        from.current = val;
        start.current = null;

        const step = (t: number) => {
            if (start.current == null) start.current = t;
            const p = Math.min(1, (t - start.current) / durationMs);
            const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
            setVal(Math.round(from.current + (target - from.current) * eased));
            if (p < 1) raf.current = requestAnimationFrame(step);
        };

        raf.current = requestAnimationFrame(step);
        return () => {
            if (raf.current) cancelAnimationFrame(raf.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [target]);

    return val;
}
