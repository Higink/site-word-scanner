import * as console from 'node:console';
import {getErrorMessage} from '../utils/error';
import {stringToURL} from '../utils/url';

/**
 * Normalizes a URL by applying several transformations:
 * - Ensures the URL has a protocol (uses https:// if missing)
 * - Validates that the hostname contains at least one dot (.)
 * - Removes trailing slashes from paths (except for root path /)
 * - Removes URL fragments/anchors
 *
 * @param url - The URL string to normalize
 * @returns The normalized URL string, or undefined if:
 *   - The URL is invalid
 *   - The hostname doesn't contain a dot
 *   - An error occurs during normalization
 *
 * @example
 * normalizeUrl("example.com/path/") // returns "https://example.com/path"
 * normalizeUrl("https://test.com/page/#section") // returns "https://test.com/page"
 * normalizeUrl("invalid") // returns undefined
 */
export default function normalizeUrl(url: string): string | undefined {
    try {
        // Ensure the URL has a protocol
        const parsedUrl = stringToURL(url);

        // Check if it's a valid hostname (contains at least one dot)
        if (!parsedUrl.hostname.includes('.')) {
            return undefined;
        }

        // Remove the last slash to correctly detect the same URLs (except if it's the root)
        if (parsedUrl.pathname !== '/' && parsedUrl.pathname.endsWith('/')) {
            parsedUrl.pathname = parsedUrl.pathname.slice(0, -1);
        }

        // Remove anchor to correctly detect the same URLs
        parsedUrl.hash = '';

        return parsedUrl.toString();
    } catch (error) {
        console.error(`Error during URL normalization: ${getErrorMessage(error)}`);
        return;
    }
}