export function formatToTitleCase(str: string): string {
    if (!str) return '';
    const upper = str.toUpperCase().trim();
    if (upper === 'TENS' || upper === 'GORE') return upper;
    
    return str.toLowerCase().split(' ').map(word => {
        if (word.includes('/')) {
            return word.split('/').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('/');
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
}
