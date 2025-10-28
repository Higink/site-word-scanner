/**
 * Options for the CLI tool.
 */
export interface CliOptions {
    format: 'json' | 'csv';
    directory?: string;
    parallel: string;
    timeout?: string;
    userAgent?: string;
}