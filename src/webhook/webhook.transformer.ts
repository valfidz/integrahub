export interface TransformerPayload {
    event: string;
    source: string;
    timestamp: string;
    summary: string;
    raw: Record<string, any>;
}

export function transformPayload(raw: Record<string, any>): TransformerPayload {
    return {
        event: raw.event ?? raw.type ?? 'unknown_event',
        source: raw.source ?? raw.app ?? 'unknown_source',
        timestamp: new Date().toISOString(),
        summary: raw.message ?? raw.description ?? JSON.stringify(raw).slice(0, 100),
        raw
    }
}