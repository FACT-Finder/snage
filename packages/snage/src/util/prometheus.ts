import {Gauge, Histogram} from 'prom-client';

export const totalNotes = new Gauge({help: 'number of notes', name: 'snage_notes_total'});

const requestHistogram = new Histogram({
    help: 'request duration buckets in seconds',
    name: 'snage_request_duration',
    labelNames: ['path', 'status'],
});

export const startRequestTimer = (path: string): ((status: number) => void) => {
    const endTimer = requestHistogram.startTimer({path});

    return (status: number): void => void endTimer({status});
};
