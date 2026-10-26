import express from 'express';
import {createServer} from 'http';
import {mkdtempSync, rmSync, writeFileSync} from 'fs';
import {tmpdir} from 'os';
import path from 'path';
import request from 'supertest';
import * as zlib from 'zlib';
import {Config} from '../config/type';
import {partialNote} from '../note/note';
import {startExpress} from './serve';

jest.mock('prom-client', () => ({
    ...jest.requireActual('prom-client'),
    collectDefaultMetrics: jest.fn(),
}));

jest.mock('zlib', () => {
    const actual = jest.requireActual('zlib');
    return {
        ...actual,
        createBrotliDecompress: jest.fn(actual.createBrotliDecompress),
        brotliDecompress: jest.fn(actual.brotliDecompress),
        brotliDecompressSync: jest.fn(actual.brotliDecompressSync),
        createGunzip: jest.fn(actual.createGunzip),
        createInflate: jest.fn(actual.createInflate),
        createUnzip: jest.fn(actual.createUnzip),
    };
});

const config: Config = {
    basedir: '.',
    template: {file: '', text: ''},
    note: {styles: () => undefined, links: () => []},
    fields: [{name: 'type', type: 'string'}],
    filterPresets: [],
    standard: {sort: {equals: (a, b) => a.id === b.id, compare: () => 0}},
};
const notes = [
    partialNote({id: 'one', summary: 'A normal change', content: 'Details', values: {type: 'fix'}}),
    partialNote({id: 'two', summary: 'Another change', content: 'More details', values: {type: 'add'}}),
];
const decoders = [
    zlib.createBrotliDecompress,
    zlib.brotliDecompress,
    zlib.brotliDecompressSync,
    zlib.createGunzip,
    zlib.createInflate,
    zlib.createUnzip,
];

const expectNoDecoders = (): void => {
    for (const decoder of decoders) {
        expect(decoder).not.toHaveBeenCalled();
    }
};

describe('serve', () => {
    let app: ReturnType<typeof createServer>;
    let ui: string;

    beforeAll(() => {
        ui = mkdtempSync(path.join(tmpdir(), 'snage-ui-'));
        writeFileSync(path.join(ui, 'index.html'), '<!doctype html><title>Snage regression fixture</title>');
        writeFileSync(path.join(ui, 'asset.js'), '/* static asset */');
        const staticMiddleware = express.static;
        jest.spyOn(express, 'static').mockImplementation(() => staticMiddleware(ui));
        jest.spyOn(express.application, 'listen').mockImplementation(function (this: express.Express) {
            app = createServer(this);
            return app;
        });
        startExpress(0)([config, notes])();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(expectNoDecoders);

    afterAll(() => {
        jest.restoreAllMocks();
        rmSync(ui, {recursive: true, force: true});
    });

    it('returns notes and field metadata using query parameters', async () => {
        const response = await request(app).get('/note').query({query: 'type = fix'}).expect(200);
        expect(response.body.notes.map((note: {id: string}) => note.id)).toEqual(['one']);
        expect(response.body.fieldOrder).toEqual(['type']);
        expect(response.body.groupByFields).toEqual(['type']);
        expect(response.headers['x-powered-by']).toBe('FACT-Finder Changelog');
    });

    it('reports invalid queries', async () => {
        await request(app).get('/note').query({query: 'type ='}).expect(400);
        await request(app).get('/export').query({query: 'type ='}).expect(400);
    });

    it('exports filtered markdown with the existing download headers', async () => {
        const response = await request(app)
            .get('/export')
            .query({query: 'type = fix', tags: 'false'})
            .expect(200)
            .expect('Content-Type', /text\/plain/)
            .expect('Content-Disposition', /attachment; filename=export\..*\.md/);
        expect(response.text).toBe('# A normal change\n\nDetails');
    });

    it('exports groups and rejects unknown grouping fields', async () => {
        const response = await request(app).get('/export').query({query: '', groupBy: 'type'}).expect(200);
        expect(response.text).toContain('# fix');
        expect(response.text).toContain('# add');
        await request(app).get('/export').query({query: '', groupBy: 'unknown'}).expect(400);
    });

    it('serves metrics', async () => {
        const response = await request(app)
            .get('/metrics')
            .expect(200)
            .expect('Content-Type', /text\/plain/);
        expect(response.text).toContain('snage_notes_total 2');
    });

    it('serves the static UI and assets', async () => {
        const response = await request(app)
            .get('/')
            .expect(200)
            .expect('Content-Type', /text\/html/);
        expect(response.text).toContain('Snage regression fixture');
        const asset = await request(app).get('/asset.js').expect(200);
        expect(asset.text).toBe('/* static asset */');
    });

    const bodies = [
        ['br', zlib.brotliCompressSync(Buffer.from('benign unused body'))],
        ['gzip', zlib.gzipSync(Buffer.from('benign unused body'))],
        ['deflate', zlib.deflateSync(Buffer.from('benign unused body'))],
    ] as const;

    describe.each(bodies)('unused %s request bodies', (encoding, body) => {
        it.each(['/note?query=', '/export?query=', '/', '/asset.js'])(
            'preserves GET %s without decompressing the body',
            async (url) => {
                const normal = await request(app).get(url).expect(200);
                const response = await request(app)
                    .get(url)
                    .set('Content-Type', 'text/plain')
                    .set('Content-Encoding', encoding)
                    .send(body)
                    .expect(200);
                expect(response.text).toBe(normal.text);
            }
        );

        it('preserves metrics without decompressing the body', async () => {
            await request(app).get('/metrics').expect(200);
            const response = await request(app)
                .get('/metrics')
                .set('Content-Type', 'text/plain')
                .set('Content-Encoding', encoding)
                .send(body)
                .expect(200);
            expect(response.text).toContain('snage_notes_total 2');
        });

        it('does not decode bodies for unsupported methods or missing routes', async () => {
            await request(app)
                .post('/note')
                .set('Content-Type', 'text/plain')
                .set('Content-Encoding', encoding)
                .send(body)
                .expect(404);
            await request(app)
                .get('/missing')
                .set('Content-Type', 'text/plain')
                .set('Content-Encoding', encoding)
                .send(body)
                .expect(404);
        });
    });
});
