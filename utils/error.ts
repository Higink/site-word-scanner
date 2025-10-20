/**
 * Get the error message from an unknown error object.
 * @param error
 * @returns string
 */
export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message.toString();
    }
    return String(error);
}