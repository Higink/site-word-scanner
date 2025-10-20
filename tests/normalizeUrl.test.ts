import normalizeUrl from '../lib/normalizeUrl';

describe('normalizeUrl', () => {
    it('should add https protocol when missing', () => {
        expect(normalizeUrl('example.com')).toBe('https://example.com/');
    });

    it('should keep existing protocol', () => {
        expect(normalizeUrl('http://example.com')).toBe('http://example.com/');
    });

    it('should handle trailing slashes correctly', () => {
        expect(normalizeUrl('https://example.com/')).toBe('https://example.com/');
        expect(normalizeUrl('https://example.com/path/')).toBe('https://example.com/path');
    });

    it('should remove URL fragments', () => {
        expect(normalizeUrl('https://example.com/page#section')).toBe('https://example.com/page');
    });

    it('should return undefined for invalid URLs', () => {
        expect(normalizeUrl('invalid')).toBeUndefined();
        expect(normalizeUrl('localhost')).toBeUndefined();
    });

    it('should handle URLs with query parameters', () => {
        expect(normalizeUrl('https://example.com/search?q=test')).toBe('https://example.com/search?q=test');
    });
});
