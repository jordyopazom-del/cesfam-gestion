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

export const formatRequestType = (type: string) => {
    const types: Record<string, string> = {
        'ADMINISTRATIVO': 'Administrativos',
        'FERIADO LEGAL': 'Feriado Legal (Vacaciones)',
        'CAPACITACION': 'Capacitaciones',
        'SIN_GOCE': 'Permiso sin Goce',
        'MATRIMONIO': 'Matrimonio',
        'NACIMIENTO': 'Nacimiento',
        'FALLECIMIENTO_CONYUGE': 'Duelo: Cónyuge o Gestación',
        'FALLECIMIENTO_PARIENTE': 'Duelo: Hermano o Padres',
        'FALLECIMIENTO_HIJO': 'Duelo: Hijo'
    };
    return types[type] || type;
};

export const formatStatus = (status: string) => {
    const statuses: Record<string, string> = {
        'APPROVED': 'AUTORIZADO',
        'REJECTED': 'RECHAZADO',
        'PENDING': 'PENDIENTE'
    };
    return statuses[status] || status;
};
