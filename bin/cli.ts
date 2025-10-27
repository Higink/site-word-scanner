#!/usr/bin/env node
/**
 * Command Line Interface for the Site Word Scanner
 * Provides a CLI tool to scan websites for word occurrences.
 *
 * Commands:
 * - <keyword>: Keyword to search for
 * - <url>: Website URL starting by HTTP or HTTPS to analyze or path to a file containing URLs (one per line)
 *
 * Options:
 * -v, --version: display version
 * -h, --help: display help
 * -f, --format: output format (json or csv) (default: json)
 * -d, --directory: output directory
 * -p, --parallel: number of parallel scans (default: 3)
 * -t, --timeout: request timeout in milliseconds
 * -u, --user-agent: custom User-Agent string
 */

import * as fs from "node:fs";
import * as path from 'path';
import console from 'node:console';
import {Command} from 'commander';
import siteWordScanner from '../src/index';
import {ScanResult} from "../types/scanResult";
import {generateOutputFilename, saveAsCSV, saveAsJSON} from '../lib/save';
import {getErrorMessage} from '../utils/error';

/**
 * Loads URLs from a file or a single URL string.
 * @param input - The input string, either a URL (starting with http:// or https://) or a file path.
 * @returns An array of URLs to process.
 */
function loadUrls(input: string): string[] {
    // Determine if input is a URL or a file path
    if (input.startsWith('http://') || input.startsWith('https://')) {
        return [input];
    } else {
        console.log(`Reading URLs from file: ${input}`);
        try {
            const content = fs.readFileSync(input, 'utf-8');
            const extractedUrls: string[] = content
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);
            console.log(`Found ${extractedUrls.length} URLs to process`);
            return extractedUrls;
        } catch (error: any) { //@TODO type
            console.error('Failed to read the file, if you meant to provide a URL, please ensure it starts with http:// or https://')
            throw new Error(error.toString());
        }
    }
}

/**
 * Processes a single URL by scanning it for the specified keyword.
 * @param url - The URL to scan.
 * @param keyword - The keyword to search for.
 * @param options - The options for the scan.
 */
async function processURL(url: string, keyword: string, options: any): Promise<ScanResult> { //@TODO type
    const resultData = await siteWordScanner(keyword, url, {
        userAgent: options.userAgent,
        timeout: options.timeout,
    });

    if (resultData.success && options.format) {
        saveResult(resultData, url, options);
    }

    return resultData;
}

/**
 * Saves the scan result to a file in the specified format.
 * @param resultData - The scan result data.
 * @param url - The URL that was scanned.
 * @param options - The options provided to the CLI.
 */
function saveResult(resultData: ScanResult, url: string, options: any) {
    const format = options.format.toLowerCase();
    const filename = generateOutputFilename(url, format);
    const outputDir = options.directory || '.';

    fs.mkdirSync(outputDir, {recursive: true});

    switch (format) {
        case 'json':
            saveAsJSON(resultData, outputDir, filename);
            console.log(`> Results for ${url} saved in: ${path.join(outputDir, filename)}`);
            break;
        case 'csv':
            saveAsCSV(resultData, outputDir, filename);
            console.log(`> Results for ${url} saved in: ${path.join(outputDir, filename)}`);
            break;
        default:
            console.warn(`Unsupported format: ${format}`);
    }
}

/**
 * Creates a loader to process multiple URLs in parallel.
 * @param urls - The list of URLs to process.
 * @param keyword - The keyword to search for.
 * @param options - The options for the scan.
 * @param parallelScans - The number of parallel scans to run.
 */
function createUrlLoader(urls: string[], keyword: string, options: any, parallelScans: number) {
    const remaining = [...urls];
    let inProgress = 0;

    function loadNext() {
        const url = remaining.shift();
        inProgress++;
        console.log('===============================');
        console.log(`Start domain scan for: ${url}`);
        console.log(`Domains remaining: ${remaining.length}`);
        console.log('===============================');

        // @ts-ignore
        processURL(url, keyword, options) //@TODO fix URL
            .then(resultData => {
                inProgress--;

                if (remaining.length > 0) {
                    // continue to load next URL, there are still URLs to process
                    loadNext();
                } else { // no more URLs to start
                    // check if it's the last promise
                    if (inProgress === 0) { // it was the last one
                        // the program was run with a single URL, output the result to console
                        if (urls.length === 1) {
                            console.log('Result report:');
                            console.log(resultData);
                        }
                        process.exit(0);
                    }
                }
            })
    }

    const initialLoads = Math.min(parallelScans, urls.length);
    console.log('Number of parallel domains scans: ', initialLoads);
    for (let i = 0; i < initialLoads; i++) {
        loadNext();
    }
}

const program = new Command();
program
    .name('site-word-scanner')
    .description('Explore websites and list all word occurrences')
    .version('1.0.1')
    .argument('<keyword>', 'Keyword to search for')
    .argument('<input>', 'Website URL starting by HTTP or HTTPS to analyze or path to a file containing URLs (one per line)')
    .option('-f, --format <format>', 'output format (json or csv)', 'json')
    .option('-d, --directory <path>', 'output directory')
    .option('-p, --parallel <number>', 'number of parallel scans', '3')
    .option('-t, --timeout <number>', 'request timeout in milliseconds')
    .option('-u, --user-agent <string>', 'custom User-Agent string')
    .action(async (keyword: string, input: string, options) => { // @TODO type des paramètres
        try {
            const lowerKeyword = keyword.toLowerCase();
            if (!lowerKeyword || lowerKeyword.length === 0) {
                throw new Error('The keyword to search for must be provided and cannot be empty.');
            }

            const parallelScans = parseInt(options.parallel) || 3;
            const urls: string[] = await loadUrls(input);
            console.log(`Start search for "${keyword}"`);
            createUrlLoader(urls, lowerKeyword, options, parallelScans);
        } catch (error) {
            console.error(getErrorMessage(error));
            process.exit(1);
        }
    });

program.parse();