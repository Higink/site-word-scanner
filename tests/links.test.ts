import {analyzeLink, isWebPageLink} from '../lib/links';

describe('analyzeLink', () => {
    const baseUrl = 'https://example.com/page';

    test('should handle valid relative URLs', () => {
        expect(analyzeLink('/other-page', baseUrl)).toBe('https://example.com/other-page');
        expect(analyzeLink('/page1', baseUrl)).toBe('https://example.com/page1');
        expect(analyzeLink('./section/page2', baseUrl)).toBe('https://example.com/section/page2');
    });

    test('should handle valid absolute URLs from same domain', () => {
        expect(analyzeLink('https://example.com/other-page', baseUrl)).toBe('https://example.com/other-page');
    });

    test('should ignore URLs from different domains', () => {
        expect(analyzeLink('https://different-domain.com/page', baseUrl)).toBeUndefined();
    });

    test('should ignore special link types', () => {
        expect(analyzeLink('#anchor', baseUrl)).toBeUndefined();
        expect(analyzeLink('mailto:test@example.com', baseUrl)).toBeUndefined();
        expect(analyzeLink('ftp://example.com', baseUrl)).toBeUndefined();
        expect(analyzeLink('tel:+1234567890', baseUrl)).toBeUndefined();
    });

    test('should handle malformed URLs gracefully', () => {
        expect(analyzeLink('http://:invalid', baseUrl)).toBeUndefined();
        expect(analyzeLink('javascript:alert(1)', baseUrl)).toBeUndefined();
    });

    test('should normalize URLs correctly', () => {
        expect(analyzeLink('https://example.com/path/', baseUrl)).toBe('https://example.com/path');
        expect(analyzeLink('https://example.com/path?param=value', baseUrl)).toBe('https://example.com/path?param=value');
        expect(analyzeLink('path/to/page', baseUrl)).toBe('https://example.com/path/to/page');
        expect(analyzeLink('invalid-url', baseUrl)).toBe('https://example.com/invalid-url');
    });

    it('should ignore external domain URLs', () => {
        expect(analyzeLink('https://other-domain.com', baseUrl)).toBeUndefined();
        expect(analyzeLink('https://sub.other-domain.com', baseUrl)).toBeUndefined();
    });

    it('should ignore severely malformed URLs', () => {
        expect(analyzeLink('javascript:alert(1)', baseUrl)).toBeUndefined();
        expect(analyzeLink('data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==', baseUrl)).toBeUndefined();
    });

    it('should handle subdomain URLs correctly', () => {
        const subdomainBase = 'https://blog.example.com';
        expect(analyzeLink('https://blog.example.com/post', subdomainBase))
            .toBe('https://blog.example.com/post');
        expect(analyzeLink('https://other.example.com/post', subdomainBase))
            .toBeUndefined();
    });

    it('should normalize URLs with query parameters', () => {
        expect(analyzeLink('/search?q=test&page=1', baseUrl))
            .toBe('https://example.com/search?q=test&page=1');
    });
});

describe('isWebPageLink', () => {
    const baseUrl = 'https://example.com';

    test('devrait identifier correctement les pages web', () => {
        expect(isWebPageLink('/page', baseUrl)).toBe(true);
        expect(isWebPageLink('/page.html', baseUrl)).toBe(true);
        expect(isWebPageLink('/page.php', baseUrl)).toBe(true);
        expect(isWebPageLink('/page.aspx', baseUrl)).toBe(true);
        expect(isWebPageLink('/folder/', baseUrl)).toBe(true);
        expect(isWebPageLink('/', baseUrl)).toBe(true);
        expect(isWebPageLink('/path/without/extension', baseUrl)).toBe(true);
    });

    test('devrait identifier correctement les fichiers', () => {
        expect(isWebPageLink('/document.pdf', baseUrl)).toBe(false);
        expect(isWebPageLink('/image.jpg', baseUrl)).toBe(false);
        expect(isWebPageLink('/file.zip', baseUrl)).toBe(false);
        expect(isWebPageLink('/document.docx', baseUrl)).toBe(false);
        expect(isWebPageLink('/file.exe', baseUrl)).toBe(false);
    });

    test('devrait gérer les URLs malformées', () => {
        expect(isWebPageLink('', baseUrl)).toBe(false);
        expect(isWebPageLink('  ', baseUrl)).toBe(false);
        expect(isWebPageLink('javascript:alert(1)', baseUrl)).toBe(false);
        expect(isWebPageLink('data:text/plain;base64,SGVsbG8=', baseUrl)).toBe(false);
        expect(isWebPageLink('mailto:test@example.com', baseUrl)).toBe(false);
    });

    test('devrait gérer les URLs avec paramètres de requête', () => {
        expect(isWebPageLink('/page?param=value', baseUrl)).toBe(true);
        expect(isWebPageLink('/file.pdf?download=true', baseUrl)).toBe(false);
    });
});
