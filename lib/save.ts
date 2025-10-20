import * as fs from 'node:fs';
import {getDomainFromUrl} from '../utils/url';
import path = require('node:path');
import {ScanResult} from '../types/scanResult';

/**
 * Generates a filename for the output file based on the URL domain and current date
 * @param url - The URL to extract the domain from
 * @param format - The desired file format extension
 * @returns A string in the format "{domain}_{date}.{format}"
 */
export function generateOutputFilename(url: string, format: string): string {
    const domain = getDomainFromUrl(url);
    const date = new Date().toISOString().split('T')[0];
    return `${domain}_${date}.${format}`;
}

/**
 * Saves the data to a JSON file in the specified directory
 * @param data - The data to be saved
 * @param directory - The directory where the file will be saved
 * @param filename - The name of the output file
 */
export function saveAsJSON(data: ScanResult, directory: string, filename: string): void {
    const filePath = `${directory}/${filename}`;
    writeToFile(filePath, JSON.stringify(data, null, 2));

}

/**
 * Saves the data to a CSV file with URL and Status Code columns
 * @param data - The data object containing visitedUrlsData array
 * @param directory - The directory where the file will be saved
 * @param filename - The name of the output file
 */
export function saveAsCSV(data: ScanResult, directory: string, filename: string): void {
    const lines: string[] = [
        'URL;Type;Content',
    ];

    data.visitedUrlsData.forEach(page => {
        if (!page.count) {
            return;
        }

        // Text occurrences
        page.text.forEach(textItem => {
            const textLine = [
                page.url,
                'TEXT',
                `"${textItem.replace(/"/g, '""')}"`
            ].join(';');
            lines.push(textLine);
        });

        // Mail occurrences
        page.mail.forEach(mailItem => {
            const mailLine = [
                page.url,
                'MAIL',
                `"${mailItem.replace(/"/g, '""')}"`
            ].join(';');
            lines.push(mailLine);
        });

        // Link occurrences
        page.link.forEach(linkItem => {
            const linkLine = [
                page.url,
                'LINK',
                `"${linkItem.replace(/"/g, '""')}"`
            ].join(';');
            lines.push(linkLine);
        });
    });

    const filePath = `${directory}/${filename}`;
    writeToFile(filePath, lines.join('\n'));
}

/**
 * Writes content to a file, creating directories if they don't exist
 * @param filePath - The full path where the file should be written
 * @param content - The content to write to the file
 */
function writeToFile(filePath: string, content: string): void {
    fs.mkdirSync(path.dirname(filePath), {recursive: true});
    fs.writeFileSync(filePath, content);
}