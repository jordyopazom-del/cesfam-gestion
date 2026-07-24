import { format } from 'date-fns';
import { Official } from '@/app/admin/personnel/actions';

export const getMailtoLink = (req: any, type: 'blockings' | 'openings', personnel: Official[]) => {
    // Build recipients list
    const recipients = ['gestiondemandafutrono@munifutrono.cl'];
    
    // 1. Submitter (the logged in user who created this request)
    if (req.submitterEmail) {
        recipients.push(req.submitterEmail);
    } else if (req.coordinator) {
        // Fallback for old requests before submitterEmail was tracked
        const fallbackMap: Record<string, string> = {
            "Directora": "direccioncesfam@munifutrono.cl",
            "Coordinadora Técnica": "coordinaciontecnica@munifutrono.cl",
            "Coordinador Rural Cordillera": "coordinacionsaludrural@munifutrono.cl",
            "Coordinador Rural Valle": "coordinacionsaludrural@munifutrono.cl",
            "Coordinador Sector 1": "coordinacions1@munifutrono.cl",
            "Coordinador Sector 2": "coordinacions2@munifutrono.cl",
            "Coordinador Convenios": "convenioscesfam@munifutrono.cl",
            "Coordinador Some": "some.cesfam@munifutrono.cl",
            "Coordinador Gore": "proyectogoread@munifutrono.cl",
            "Encargado Agendas": "kkoandres@gmail.com",
        };
        const mappedEmail = fallbackMap[req.coordinator];
        if (mappedEmail) recipients.push(mappedEmail);
    }

    // 2. Professional (the clinician who is missing/having their agenda opened)
    const professional = personnel.find(p => p.name.toLowerCase() === req.professionalName?.toLowerCase());
    if (professional?.email) recipients.push(professional.email);

    // 3. Assigned Admin
    if (req.assignedAdmin && req.assignedAdmin !== 'N/A') {
        const admin = personnel.find(p => p.name.toLowerCase() === req.assignedAdmin.toLowerCase());
        if (admin?.email) recipients.push(admin.email);
    }

    const isBlock = type === 'blockings';
    const pdfUrls = Array.isArray(req.pdfUrl) ? req.pdfUrl : [];
    const hasDocs = pdfUrls.length > 0 && pdfUrls[0] !== 'SIN PACIENTES';
    
    let docLinksText = '';
    if (hasDocs) {
        docLinksText = pdfUrls.map((url: string, idx: number) => {
            const link = (url === 'INTERNAL_PDF' || url.startsWith('data:'))
                ? `${window.location.origin}/api/pdf/${req.id}?index=${idx}` 
                : url;
            return `Documento ${idx + 1}: ${link}`;
        }).join('\n');
    } else {
        docLinksText = 'Sin documento añadido';
    }

    const subject = encodeURIComponent(`Gestión Finalizada: ${isBlock ? 'Bloqueo' : 'Apertura'} - ${req.professionalName}`);
    
    const sortedDays = [...(req.selectedDays || [])].sort((a: any, b: any) => new Date(a).getTime() - new Date(b).getTime());
    let datesString = 'No especificado';
    if (sortedDays.length === 1) {
        datesString = format(new Date(sortedDays[0]), 'dd-MM-yyyy');
    } else if (sortedDays.length > 1) {
        datesString = `desde el ${format(new Date(sortedDays[0]), 'dd-MM-yyyy')} al ${format(new Date(sortedDays[sortedDays.length - 1]), 'dd-MM-yyyy')}`;
    }

    let patientsNote = '';
    const status = req.agendaBlockedStatus || req.status;

    if (isBlock && status === 'Realizado') {
        patientsNote = `\n👨‍⚕️ Registro de Pacientes:\nEl listado de pacientes asociados a este bloqueo ya fue registrado en el módulo de Reprogramación. El funcionario asignado los tiene disponibles en su Bandeja de Entrada en la plataforma para iniciar los llamados correspondientes.\n`;
    } else if (status === 'Sin Agenda') {
        patientsNote = `\nℹ️ Observación:\nEl profesional no registraba pacientes citados en el tramo indicado (Sin Agenda).\n`;
    } else if (status === 'No Corresponde') {
        patientsNote = `\n❌ Observación:\nLa solicitud no corresponde o ha sido rechazada.\n`;
    } else if (status === 'Desbloqueado') {
        patientsNote = `\n✅ Observación:\nLa agenda ha sido desbloqueada exitosamente.\n`;
    } else if (hasDocs) {
        patientsNote = `\n📄 Documento Adjunto:\n${docLinksText}\n`;
    }

    const bodyText = `Estimado/a,

Le informamos que la solicitud de ${isBlock ? 'Bloqueo' : 'Apertura'} ha sido procesada y finalizada con éxito.

📋 Detalles de la Gestión:
- Profesional: ${req.professionalName}
- Solicitante: ${req.coordinator}
- Tipo: ${isBlock ? req.blockType : req.performance + ' MIN'}
- ${isBlock ? 'Fechas Bloqueadas' : 'Fechas de Apertura'}: ${datesString}
- Horario: ${req.startTime} - ${req.endTime}
- Administrativo Asignado: ${req.assignedAdmin && req.assignedAdmin !== 'N/A' ? req.assignedAdmin : 'Ninguno (No requiere llamados)'}
${patientsNote}
Saludos cordiales.`;
    
    const uniqueRecipients = Array.from(new Set(recipients)).filter(Boolean);
    const mailtoLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${uniqueRecipients.join(',')}&su=${subject}&body=${encodeURIComponent(bodyText)}`;
    
    return mailtoLink;
};

export const handleSendEmail = (req: any, type: 'blockings' | 'openings', personnel: Official[]) => {
    const link = getMailtoLink(req, type, personnel);
    window.open(link, '_blank', 'noopener,noreferrer');
};

