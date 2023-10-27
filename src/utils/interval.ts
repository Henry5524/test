import { useEffect, useRef } from 'react';

/**
 * Reliable form of setInterval with React functional components.
 * Copied from Dan Abramov's code at https://overreacted.io/making-setinterval-declarative-with-react-hooks/
 * @param callback
 * @param delay
 */
export function useInterval(callback: Function, delay: number) {
    const savedCallback = useRef();

    useEffect(() => {
        // @ts-ignore
        savedCallback.current = callback;
    });

    useEffect(() => {
        function tick() {
            // @ts-ignore
            savedCallback.current();
        }

        let id = setInterval(tick, delay);
        return () => clearInterval(id);
    }, [delay]);
}

