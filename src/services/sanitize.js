import DOMPurify from 'dompurify';

/**
 * XSS Sanitizer to protect against malicious HTML/script injections
 */
export function sanitizeHtml(dirty) {
    if (!dirty) return '';
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'span', 'p', 'code', 'pre', 'ul', 'ol', 'li', 'sub', 'sup'],
        ALLOWED_ATTR: ['href', 'target', 'class', 'style', 'rel'],
    });
}

/**
 * Format AI markdown highlights (bold, bullets, linebreaks) cleanly and safely
 */
export function formatAiExplanation(text) {
    if (!text) return '';
    let formatted = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
        .replace(/^-\s+(.*)$/gm, '• $1')
        .replace(/\n/g, '<br/>');
    return sanitizeHtml(formatted);
}
