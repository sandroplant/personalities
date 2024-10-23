declare module 'sanitize-html' {
    interface SanitizeHtmlOptions {
        allowedTags?: string[];
        allowedAttributes?: { [key: string]: string[] };
        // Add other options as needed
    }

    function sanitizeHtml(dirty: string, options?: SanitizeHtmlOptions): string;

    export = sanitizeHtml;
}
