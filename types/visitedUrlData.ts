/**
 * Data about a visited URL
 */
export interface VisitedUrlData {
    /** Visited URL */
    url: string;
    /** HTTP status code or error message */
    status: number | string;
    /** Total occurrences found in the domain */
    count: number;
    /** Text occurrences found */
    text: string[];
    /** Mailto occurrences found */
    mail: string[];
    /** Link occurrences found */
    link: string[];
}