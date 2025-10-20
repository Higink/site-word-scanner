import siteWordScanner from '../src/index';
import axios, {AxiosError} from 'axios';
import { ScanOptions } from '../types/scanOptions';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const defaultOptions: ScanOptions = {
    userAgent: 'TestBot/1.0',
    timeout: 5000
};

describe('Core Scanner', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Validation d\'URL', () => {
        it('devrait rejeter les URLs invalides', async () => {
            const result = await siteWordScanner('test', 'invalid-url', defaultOptions);
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('Analyse de site réussie', () => {
        it('devrait analyser un site web simple avec succès', async () => {
            mockedAxios.get.mockResolvedValueOnce({
                status: 200,
                data: '<html lang="fr"><body><a href="https://example.com/page2">Link</a></body></html>'
            });

            const result = await siteWordScanner('test', 'https://example.com', defaultOptions);

            expect(result.success).toBe(true);
            expect(result.error).toBeUndefined();
            expect(Array.isArray(result.visitedUrlsData)).toBe(true);
        });

        it('devrait traiter plusieurs liens sur une page', async () => {
            mockedAxios.get.mockResolvedValueOnce({
                status: 200,
                data: `
                    <html lang="fr">
                        <a href="/page1">Lien 1</a>
                        <a href="/page2">Lien 2</a>
                        <a href="https://example.com/page3">Lien 3</a>
                        <a href="https://otherdomain.com">Lien Externe</a>
                    </html>`
            }).mockResolvedValue({
                status: 200,
                data: '<html lang="fr"></html>'
            });

            const result = await siteWordScanner('test', 'https://example.com', defaultOptions);
            expect(result.success).toBe(true);
            expect(result.visitedUrlsData.length).toBeGreaterThan(1);
        });
    });

    describe('Gestion des erreurs réseau', () => {
        it('devrait gérer les timeouts', async () => {
            const error = new Error('timeout') as AxiosError;
            error.code = 'ECONNABORTED';
            error.isAxiosError = true;
            mockedAxios.get.mockRejectedValueOnce(error);

            const result = await siteWordScanner('test', 'https://example.com', defaultOptions);
            expect(result.success).toBe(true);
            expect((result.visitedUrlsData[0] ?? {}).status).toBe('TIMEOUT');
        });

        it('devrait gérer les erreurs DNS', async () => {
            const error = new Error('DNS error') as AxiosError;
            error.code = 'ENOTFOUND';
            error.isAxiosError = true;
            mockedAxios.get.mockRejectedValueOnce(error);

            const result = await siteWordScanner('test', 'https://example.com', defaultOptions);
            expect(result.success).toBe(true);
            expect((result.visitedUrlsData[0] ?? {}).status).toBe('DNS_ERROR');
        });

        it('devrait gérer les connexions refusées', async () => {
            const error = new Error('connection refused') as AxiosError;
            error.code = 'ECONNREFUSED';
            error.isAxiosError = true;
            mockedAxios.get.mockRejectedValueOnce(error);

            const result = await siteWordScanner('test', 'https://example.com', defaultOptions);
            expect(result.success).toBe(true);
            expect((result.visitedUrlsData[0] ?? {}).status).toBe('CONNECTION_REFUSED');
        });

        it('devrait gérer les erreurs réseau génériques', async () => {
            mockedAxios.get.mockRejectedValueOnce(new Error('Erreur réseau'));

            const result = await siteWordScanner('test', 'https://example.com', defaultOptions);
            expect(result.success).toBe(true);
            expect((result.visitedUrlsData ?? []).some(data =>
                data.status === 'UNKNOWN_ERROR'
            )).toBe(true);
        });
    });

    describe('Gestion des réponses HTTP', () => {
        it('devrait gérer différents codes de statut HTTP', async () => {
            mockedAxios.get.mockResolvedValueOnce({
                status: 404,
                data: '<html lang="fr"></html>'
            });

            const result = await siteWordScanner('test', 'https://example.com', defaultOptions);
            expect(result.success).toBe(true);
            expect((result.visitedUrlsData[0] ?? {}).status).toBe(404);
        });

        it('devrait gérer le HTML malformé', async () => {
            mockedAxios.get.mockResolvedValueOnce({
                status: 200,
                data: '<html lang="fr"><a href="malformed">Lien cassé</a></html>'
            });

            const result = await siteWordScanner('test', 'https://example.com', defaultOptions);
            expect(result.success).toBe(true);
            expect((result.visitedUrlsData[0] ?? {}).status).toBe(200);
        });

        it('devrait gérer les réponses non-HTML', async () => {
            mockedAxios.get.mockResolvedValueOnce({
                status: 200,
                data: 'Contenu texte brut'
            });

            const result = await siteWordScanner('test', 'https://example.com', defaultOptions);
            expect(result.success).toBe(true);
            expect((result.visitedUrlsData[0] ?? {}).status).toBe(200);
        });

        it('should find occurrences of a word in the page', async () => {
            mockedAxios.get.mockResolvedValueOnce({
                status: 200,
                data: '<html lang="en"><body>lorem ipsum TURTLE, oh look a link <a href="https://wwww.tUrtle.com">i\'m a link</a> send me a mail here <a href="mailto:donatello@turtle.com">mail me</a> <a href="mailto:turtle@pizza.com">or here</a></body></html>'
            });

            const result = await siteWordScanner('turtle', 'https://example.com', defaultOptions);
            expect(result.success).toBe(true);
            expect((result.visitedUrlsData[0] ?? {}).status).toBe(200);
            expect((result.visitedUrlsData[0] ?? {}).count).toBe(4);
            expect((result.visitedUrlsData[0] ?? {text:[]}).text[0]).toBe("lorem ipsum turtle, oh look a link i'm a link se");
            expect((result.visitedUrlsData[0] ?? {mail:[]}).mail.length).toBe(2);
            expect((result.visitedUrlsData[0] ?? {mail:[]}).mail[0]).toBe("donatello@turtle.com");
            expect((result.visitedUrlsData[0] ?? {mail:[]}).mail[1]).toBe("turtle@pizza.com");
            expect((result.visitedUrlsData[0] ?? {link:[]}).link[0]).toBe('https://wwww.turtle.com/');
        });
    });
});
