import { useCallback, useEffect, useRef } from 'react';

export const useAnimationFrame = (callback: (time: number) => void) => {
    const requestRef = useRef<number>();
    const previousTimeRef = useRef<number>();
    const animate = useCallback((time: number) => {
        if (previousTimeRef.current !== undefined) {
            callback(time - previousTimeRef.current);
        }
        previousTimeRef.current = time;
        requestRef.current = requestAnimationFrame(animate);
    }, [callback]);
    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current as number);
    }, [animate]);
}
