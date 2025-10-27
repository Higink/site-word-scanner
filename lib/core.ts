import {getErrorMessage} from '../utils/error';
import axios, {AxiosError} from 'axios';
import * as cheerio from 'cheerio';
import {analyzeLink, isWebPageLink} from './links';
import {getDomainFromUrl} from '../utils/url';
import normalizeUrl from './normalizeUrl';
import {ScanResult} from '../types/scanResult';
import {VisitedUrlData} from '../types/visitedUrlData';
import {ScanOptions} from '../types/scanOptions';

/**
 * Performs a complete scan of a website starting from a given URL
 * Crawls all internal links and checks their HTTP status
 *
 * @param keyword - The word to search for in the website content
 * @param url - The starting URL to scan
 * @param options - Scan options
 * @param options.userAgent - Custom User-Agent string for HTTP requests
 * @param options.timeout - Request timeout in milliseconds
 * @returns An object containing:
 *   - success: boolean indicating if the scan was successful
 *   - error: error message if success is false
 *   - visitedUrlsData: array of objects containing visited URLs and their status codes
 */
export async function scan(keyword: string, url: string, options: ScanOptions = {}): Promise<ScanResult> {
    let normalizedSourceURL;
    let domain;

    try {
        normalizedSourceURL = normalizeUrl(url);
        domain = getDomainFromUrl(url);
        if (!normalizedSourceURL || !domain) {
            throw new Error('The URL is not valid');
        }
    } catch (error) {
        return {
            generatedAt: new Date().toISOString(),
            domain: url,
            success: false,
            error: getErrorMessage(error),
            totalVisitedUrls: 0,
            visitedUrlsData: []
        };
    }

    const urlsToVisit: Set<string> = new Set();
    const visitedUrls: Set<string> = new Set();
    const visitedUrlsData: VisitedUrlData[] = [];
    const statusCodesCount: { [key: string]: number } = {};

    urlsToVisit.add(normalizedSourceURL);

    while (urlsToVisit.size > 0) {
        const currentUrl = urlsToVisit.values().next().value;
        console.log(`${normalizedSourceURL} ${(100 * visitedUrls.size / (visitedUrls.size + urlsToVisit.size) >> 0)}% [Visited:${visitedUrls.size} | Remaining:${urlsToVisit.size}]`);;

        if (typeof currentUrl !== 'string') {
            // @ts-ignore
            urlsToVisit.delete(currentUrl);
            continue;
        }

        urlsToVisit.delete(currentUrl);
        visitedUrls.add(currentUrl);

        try {
            // Get the page content
            const response = await axios.get(currentUrl, {
                headers: {
                    'User-Agent': options.userAgent || 'Mozilla/5.0 (compatible; SiteWordScanner/1.0)',
                },
                timeout: options.timeout || 0, // default axios is no timeout
            });

            // Parse HTML
            const $ = cheerio.load(response.data);
            const bodyText = $('body').text().toLowerCase();

            // Find all word occurrences in text
            const textOccurrences: string[] = [];
            let lastIndex = 0;
            while ((lastIndex = bodyText.indexOf(keyword, lastIndex)) !== -1) {
                const start = Math.max(0, lastIndex - 30);
                const end = Math.min(bodyText.length, lastIndex + 36);
                let context = bodyText.slice(start, end).replace(/\s+/g, ' ').trim();
                textOccurrences.push(context);
                lastIndex += keyword.length;
            }

            // Find occurrences in mailto links
            const mailtoOccurrences: string[] = [];
            $('a[href^="mailto:"]').each((i, elem) => {
                const mailtoHref = $(elem).attr('href');
                if (mailtoHref) {
                    // chercher les adresses email contenant mailto: @MOT_A_RECHERCHER
                    const emailMatch = mailtoHref.match(new RegExp(`mailto:(.*${keyword}.*)`));
                    if (emailMatch && emailMatch[1]) {
                        const email = emailMatch[1];
                        mailtoOccurrences.push(email);
                    }
                }
            });

            // Find occurrences in links
            const pageLinks = $('a[href]');
            const linkOccurrences: string[] = [];
            pageLinks.each((i, elem) => {
                const href = $(elem).attr('href');
                if (href) {
                    const absoluteUrl = new URL(href, currentUrl);
                    if (absoluteUrl.hostname.includes(`${keyword}.`)) {
                        linkOccurrences.push(absoluteUrl.toString());
                    }
                }
            });

            // Find next links to visit
            pageLinks.each((_, element) => {
                const href = $(element).attr('href');
                if (href && isWebPageLink(href, normalizedSourceURL)) {
                    const validatedLink = analyzeLink(href, normalizedSourceURL);
                    if (validatedLink && !visitedUrls.has(validatedLink) && !urlsToVisit.has(validatedLink)) {
                        urlsToVisit.add(validatedLink);
                    }
                }
            });

            visitedUrlsData.push({
                url: currentUrl,
                status: response.status,
                count: textOccurrences.length + mailtoOccurrences.length + linkOccurrences.length,
                text: textOccurrences,
                mail: mailtoOccurrences,
                link: linkOccurrences,
            });
        } catch (error) {
            // Error during the page fetch
            let errorType: number | string = 'UNKNOWN_ERROR';
            const axiosError = error as AxiosError;
            if (axiosError.isAxiosError) {
                if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
                    errorType = 'TIMEOUT';
                } else if (axiosError.code === 'ENOTFOUND') {
                    errorType = 'DNS_ERROR';
                } else if (axiosError.code === 'ECONNREFUSED') {
                    errorType = 'CONNECTION_REFUSED';
                } else if (axiosError.response) {
                    errorType = axiosError.response.status;
                }
            }

            statusCodesCount[errorType] = (statusCodesCount[errorType] || 0) + 1;
            visitedUrlsData.push({
                url: currentUrl,
                status: errorType,
                count: 0,
                text: [],
                mail: [],
                link: [],
            });
        }
    }

    return {
        generatedAt: new Date().toISOString(),
        domain: domain,
        success: true,
        totalVisitedUrls: visitedUrls.size,
        visitedUrlsData: visitedUrlsData
    };

}

export default scan;