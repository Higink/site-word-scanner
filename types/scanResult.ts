import {VisitedUrlData} from './visitedUrlData.js';

/**
 * Result of the scan of a URL
 */
export interface ScanResult {
    /** Date when the report was generated */
    generatedAt: string;
    /** Analyzed domain */
    domain: string;
    /** Indicates if the scan was completed successfully */
    success: boolean;
    /** Error message if success is false */
    error?: string;
    /** Total number of visited URLs */
    totalVisitedUrls: number;
    /** Detailed data about visited URLs */
    visitedUrlsData: VisitedUrlData[];
}

