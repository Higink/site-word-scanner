import normalizeUrl from './normalizeUrl';
import {getErrorMessage} from '../utils/error';
import {getDomainFromUrl} from '../utils/url';

/**
 * Analyzes a link found in a webpage and processes it for crawling
 *
 * @param link - The link URL to analyze (can be relative or absolute)
 * @param sourceUrl - The URL of the page where the link was found
 * @returns The normalized absolute URL if it's valid and from the same domain, undefined otherwise
 */
export function analyzeLink(link: string, sourceUrl: string): string | undefined {
    try {
        // Ignore other links types than page links
        if (link.startsWith('#')
            || link.startsWith('mailto:')
            || link.startsWith('ftp:')
            || link.startsWith('tel:')) {
            //@TODO search if can reverse condition (only http/https or relative)
            return;
        }

        const absoluteUrl = new URL(link, sourceUrl).toString();
        const normalizedUrl = normalizeUrl(absoluteUrl);

        if (!isSameDomain(absoluteUrl, sourceUrl)) {
            return;
        }

        return normalizedUrl;
    } catch (error) {
        console.error(`Error during link analysis: ${getErrorMessage(error)}`);
        return;
    }
}

/**
 * Checks if two URLs belong to the same domain
 *
 * @param url1 - First URL to compare
 * @param url2 - Second URL to compare
 * @returns true if both URLs have the same domain, false otherwise
 */
function isSameDomain(url1: string, url2: string): boolean {
    try {
        const domain1 = getDomainFromUrl(url1);
        const domain2 = getDomainFromUrl(url2);
        return domain1 === domain2;
    } catch {
        console.warn(`Error during domain comparison between ${url1} and ${url2}`);
        return false;
    }
}