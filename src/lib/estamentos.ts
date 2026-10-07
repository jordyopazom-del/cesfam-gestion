// Catálogo oficial de Estamentos y Profesiones basado en GIA-CESFAM
export const ESTAMENTOS_OFICIALES = [
    "ADMINISTRATIVO (A)",
    "AGENTE COMUNITARIO",
    "ASISTENTE SOCIAL",
    "AUX. PARAMÉDICO",
    "AUXILIAR DE SERVICIO",
    "AUXILIAR DE SERVICIO (ARCHIVO)",
    "CONDUCTOR",
    "EDUCADORA DE PÁRVULOS",
    "ENFERMERO (A)",
    "FONOAUDIÓLOGO (A)",
    "GESTORA COMUNITARIA",
    "INFORMÁTICO",
    "KINESIÓLOGO (A)",
    "LAWENTECHEFE",
    "MATRÓN (A)",
    "MÉDICO",
    "NUTRICIONISTA",
    "ODONTÓLOGO (A)",
    "PSICÓLOGO (A)",
    "QUÍMICO FARMACÉUTICO",
    "TEC. ED. PARVULARIA",
    "TECNICO SOCIAL",
    "TED. ED. ESPECIAL",
    "TENS",
    "TERAPEUTA OCUPACIONAL",
    "TRABAJADOR SOCIAL",
] as const;

/**
 * Normaliza cualquier variante histórica de profesión al estamento oficial de GIA.
 */
export function normalizeProfession(raw: string | null | undefined): string {
    if (!raw) return 'SIN DEFINIR';
    const trimmed = raw.trim().toUpperCase();

    // Reglas de mapeo específicas
    if (trimmed.includes('MEDIC') || trimmed === 'MEDICO' || trimmed === 'MÉDICO') {
        return 'MÉDICO';
    }
    if (trimmed.includes('ENFERMER')) {
        return 'ENFERMERO (A)';
    }
    if (trimmed.includes('KINESI')) {
        return 'KINESIÓLOGO (A)';
    }
    if (trimmed.includes('MATRON') || trimmed.includes('MATRÓN')) {
        return 'MATRÓN (A)';
    }
    if (trimmed.includes('PSICOL') || trimmed.includes('PSICÓL')) {
        return 'PSICÓLOGO (A)';
    }
    if (trimmed.includes('TRABAJAD') && trimmed.includes('SOCIAL')) {
        return 'TRABAJADOR SOCIAL';
    }
    if (trimmed.includes('ASISTENT') && trimmed.includes('SOCIAL')) {
        return 'ASISTENTE SOCIAL';
    }
    if (trimmed.includes('NUTRICION')) {
        return 'NUTRICIONISTA';
    }
    if (trimmed.includes('ODONTOL') || trimmed.includes('ODONTÓL') || trimmed.includes('DENTIST') || trimmed.includes('ORTODONC')) {
        return 'ODONTÓLOGO (A)';
    }
    if (trimmed.includes('FONOAUD')) {
        return 'FONOAUDIÓLOGO (A)';
    }
    if (trimmed.includes('PARVUL') || trimmed.includes('PÁRVUL')) {
        if (trimmed.includes('TEC')) return 'TEC. ED. PARVULARIA';
        return 'EDUCADORA DE PÁRVULOS';
    }
    if (trimmed.includes('TERAPEUT') || trimmed.includes('OCUPACIONAL')) {
        return 'TERAPEUTA OCUPACIONAL';
    }
    if (trimmed.includes('QUIMIC') || trimmed.includes('QUÍMIC') || trimmed.includes('FARMACEUT')) {
        return 'QUÍMICO FARMACÉUTICO';
    }
    if (trimmed === 'TENS' || trimmed.includes('TECNICO EN ENFERMERIA') || trimmed.includes('TÉCNICO EN ENFERMERÍA')) {
        return 'TENS';
    }
    if (trimmed.includes('CONDUCTOR') || trimmed.includes('CHOFER')) {
        return 'CONDUCTOR';
    }
    if (trimmed.includes('ADMINISTRAT')) {
        return 'ADMINISTRATIVO (A)';
    }
    if (trimmed.includes('INFORMATIC') || trimmed.includes('INFORMÁTIC')) {
        return 'INFORMÁTICO';
    }
    if (trimmed.includes('AUXILIAR')) {
        if (trimmed.includes('ARCHIVO')) return 'AUXILIAR DE SERVICIO (ARCHIVO)';
        return 'AUXILIAR DE SERVICIO';
    }
    if (trimmed.includes('PARAMEDIC') || trimmed.includes('PARAMÉDIC')) {
        return 'AUX. PARAMÉDICO';
    }
    if (trimmed.includes('COMUNITARI')) {
        if (trimmed.includes('GESTOR')) return 'GESTORA COMUNITARIA';
        return 'AGENTE COMUNITARIO';
    }
    if (trimmed.includes('LAWEN')) {
        return 'LAWENTECHEFE';
    }

    // Si coincide exactamente con alguno oficial
    const matchExact = ESTAMENTOS_OFICIALES.find(e => e.toLowerCase() === raw.trim().toLowerCase());
    if (matchExact) return matchExact;

    return trimmed;
}

/**
 * Determina el área (CLINICO o ADMINISTRATIVO) basado en la profesión normalizada.
 */
export function getAreaType(profession: string): 'CLINICO' | 'ADMINISTRATIVO' {
    const norm = normalizeProfession(profession).toUpperCase();
    if (
        norm.includes('ADMINISTRATIVO') ||
        norm.includes('CONDUCTOR') ||
        norm.includes('INFORMÁTICO') ||
        norm.includes('AUXILIAR') ||
        norm.includes('ARCHIVO') ||
        norm.includes('SERVICIO')
    ) {
        return 'ADMINISTRATIVO';
    }
    return 'CLINICO';
}
