/**
 * Converts a string to a URL object, adding https protocol if missing
 *
 * @param url - The URL string to convert
 * @returns A URL object with guaranteed protocol
 */
export function stringToURL(url: string): URL {
    // Add protocol if missing
    if (!url.match(/^https?:\/\//)) {
        url = 'https://' + url;
    }
    return new URL(url.trim());
}

/**
 * Extracts the domain from a URL, removing 'www.' prefix
 *
 * @param url - The URL to extract the domain from
 * @returns The clean domain name without 'www.' prefix
 */
export function getDomainFromUrl(url: string): string {
    return stringToURL(url).hostname.replace(/^www\./, '');
}