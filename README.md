# Site Word Scanner

Crawl website pages and find all occurrences of a word in links, emails, and text content.

## Features

- Crawls all internal pages on a domain
- Customizable User-Agent and timeout settings
- Export report in JSON or CSV format

## Installation

Globally

```bash
npm install -g site-word-scanner
```

or use NPX

```bash
npx site-word-scanner turtle https://example.com
```

## Usage CLI

```bash
site-word-scanner <keyword> <url> [options]
```

### Arguments

- `<keyword>`: Word to search for on the website (required)
- `<url>`: Website URL to analyze (required)

### Options

| Option                  | Alias | Description                         |
|-------------------------|-------|-------------------------------------|
| `--help`                | `-h`  | Display help information            |
| `--format <format>`     | `-f`  | Output format (JSON or CSV)         |
| `--directory <path>`    | `-d`  | Output directory for saving results |
| `--output <filename>`   | `-o`  | Custom output filename              |
| `--timeout <number>`    | `-t`  | Request timeout in milliseconds     |
| `--user-agent <string>` | `-u`  | Custom User-Agent string            |
| `--version`             | `-v`  | Display version                     |

### Examples

```bash
# Basic scan
site-word-scanner ponyr https://example.co

# Scan for a phrase
site-word-scanner 'ultimate rainbow unicorn' https://example.com

# Scan with custom timeout and save as JSON
site-word-scanner pony https://example.com -t 10000 -f json

# Save results to specific directory with custom filename
site-word-scanner pony https://example.com -f csv -d ./reports -o my-scan-report

# Use custom User-Agent
site-word-scanner pony https://example.com -u "Mozilla/5.0 TrustMeImNotABot/1.0"
```

## Usage in NodeJS

```typescript
import siteWordScanner from 'site-word-scanner';

// Basic usage
const result = await siteWordScanner('turtle', 'https://example.com');

// With options
const resultAgain = await siteWordScanner('turtle', 'https://example.com', {
    userAgent: "Mozilla/5.0 TrustMeImNotABot/1.0", // Custom User-Agent string for HTTP requests
    timeout: 5000 // Request timeout in milliseconds
});
```

### Returns

Returns a Promise that resolves to a `ScanResult` object:

```typescript
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
    visitedUrlsData: {
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
    }[];
}
```

## License

This project is licensed under CC BY-NC-SA.

![CC BY-NC-SA](https://mirrors.creativecommons.org/presskit/buttons/88x31/png/by-nc-sa.png)
