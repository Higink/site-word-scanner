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
            || link.startsWith('data:')
            || link.startsWith('javascript:')
            || link.startsWith('tel:')) {
            //@TODO search if can reverse condition (only http/https or relative)
            return;
        }

        const absoluteUrl = new URL(link, sourceUrl).toString();
        if (!isSameDomain(absoluteUrl, sourceUrl)) {
            return;
        }

        return normalizeUrl(absoluteUrl);
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


/**
 * Determines if a given link points to a web page or a file based on its extension
 *
 * @param href - The link URL to analyze (can be relative or absolute)
 * @param sourceUrl - The base URL of the page where the link was found
 * @returns true if the link is likely a web page, false if it's likely a file
 */
export function isWebPageLink(href: string, sourceUrl: string): boolean {
    // Ignore empty links
    if (!href || href.trim().length === 0) {
        return false;
    }

    // Ignore special protocols
    if (href.startsWith('mailto:')
        || href.startsWith('#')
        || href.startsWith('tel:')
        || href.startsWith('ftp:')
        || href.startsWith('javascript:')
        || href.startsWith('data:')) {
        return false;
    }

    try {
        const webPageExtensions = [
            'html', 'htm', 'php', 'asp', 'aspx', 'jsp', 'xhtml', 'cfm', 'shtm', 'shtml', 'rhtml', 'dhtml', 'py', 'rb', 'pl', 'cgi', 'jhtml', 'do', 'action', 'erb', 'ejs', 'vue', 'cshtml', 'tsx', 'jsx'
        ];

        const parsedUrl = new URL(href, sourceUrl);
        const pathname = parsedUrl.pathname;

        // Handle root path and folders
        if (pathname === '/' || pathname.endsWith('/')) {
            return true;
        }

        const segments = pathname.split('/');
        const lastSegment = segments[segments.length - 1];

        // If no last segment or empty, likely a directory
        if (!lastSegment) {
            return true;
        }

        if (lastSegment.includes('.')) {
            const extension = lastSegment.split('.').pop();
            if (extension) {
                return webPageExtensions.includes(extension.toLowerCase());
            } else {
                return false;
            }
        }
        return true; // No extension, likely a web page

    } catch (error) {
        console.warn(`Error isWebPageLink for ${href}`);
        return false;
    }
}

