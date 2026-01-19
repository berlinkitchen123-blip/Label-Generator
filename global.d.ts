declare namespace React {
    type FC<P = {}> = (props: P) => any;
    type ReactNode = any;
    type ChangeEvent<T = any> = { target: T & { files: any[] } };
}

declare module 'react' {
    export = React;
    export function useState<T>(initial: T | (() => T)): [T, (v: T | ((prev: T) => T)) => void];
    export function useEffect(effect: () => (void | (() => void)), deps?: any[]): void;
    export function useMemo<T>(factory: () => T, deps?: any[]): T;
    export function useRef<T>(initial: T | null): { current: T };
    export const Fragment: any;
}

declare module 'react-dom/client' {
    const createRoot: any;
    export { createRoot };
}

declare module 'lucide-react';
declare module 'firebase/app';
declare module 'firebase/firestore';

declare namespace JSX {
    interface IntrinsicElements {
        [elemName: string]: any;
    }
}

declare var process: {
    env: {
        API_KEY: string;
    };
};

declare var XLSX: any;
