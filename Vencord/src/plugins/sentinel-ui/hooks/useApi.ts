import { React } from "@webpack/common";

interface UseApiState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
}

export function useApi<T>(
    fetcher: () => Promise<T>,
    deps: any[] = [],
    immediate: boolean = true
): UseApiState<T> & { refetch: () => void } {
    const [state, setState] = React.useState<UseApiState<T>>({
        data: null,
        loading: immediate,
        error: null,
    });

    const fetchData = React.useCallback(async () => {
        setState(prev => ({ ...prev, loading: true, error: null }));
        try {
            const data = await fetcher();
            setState({ data, loading: false, error: null });
        } catch (err: any) {
            setState({ data: null, loading: false, error: err.message || "Unknown error" });
        }
    }, deps);

    React.useEffect(() => {
        if (immediate) {
            fetchData();
        }
    }, [fetchData, immediate]);

    return { ...state, refetch: fetchData };
}
