'use server';

import { prisma } from '@/lib/prisma';
import type { Posta, Vehiculo, Personal, Paciente, Ronda, SolicitudSalida } from '@/data/logistica/types';

// --- POSTAS ---
export const getPostas = async (): Promise<Posta[]> => {
    const postas = await prisma.posta.findMany();
    return postas.map(p => ({
        id: p.id,
        nombre: p.nombre,
        distanciaKm: p.distanciaKm,
        coordenadas: { x: p.coordX || 0, y: p.coordY || 0 }
    }));
};
export const addPosta = async (posta: Posta) => {
    await prisma.posta.create({
        data: { id: posta.id, nombre: posta.nombre, distanciaKm: posta.distanciaKm, coordX: posta.coordenadas.x, coordY: posta.coordenadas.y }
    });
};
export const updatePosta = async (posta: Posta) => {
    await prisma.posta.update({
        where: { id: posta.id },
        data: { nombre: posta.nombre, distanciaKm: posta.distanciaKm, coordX: posta.coordenadas.x, coordY: posta.coordenadas.y }
    });
};
export const deletePosta = async (id: string) => {
    await prisma.posta.delete({ where: { id } });
};

// --- VEHICULOS ---
export const getVehiculos = async (): Promise<Vehiculo[]> => {
    const vehiculos = await prisma.vehiculo.findMany();
    return vehiculos.map(v => ({
        id: v.id,
        marcaModelo: v.marcaModelo,
        patente: v.patente,
        capacidadTotal: v.capacidadTotal,
        estado: v.estado as 'Disponible' | 'En Mantención'
    }));
};
export const addVehiculo = async (vehiculo: Vehiculo) => {
    await prisma.vehiculo.create({
        data: { id: vehiculo.id, marcaModelo: vehiculo.marcaModelo, patente: vehiculo.patente, capacidadTotal: vehiculo.capacidadTotal, estado: vehiculo.estado }
    });
};
export const updateVehiculo = async (vehiculo: Vehiculo) => {
    await prisma.vehiculo.update({
        where: { id: vehiculo.id },
        data: { marcaModelo: vehiculo.marcaModelo, patente: vehiculo.patente, capacidadTotal: vehiculo.capacidadTotal, estado: vehiculo.estado }
    });
};
export const deleteVehiculo = async (id: string) => {
    await prisma.vehiculo.delete({ where: { id } });
};

// --- PERSONAL ---
export const getPersonal = async (): Promise<Personal[]> => {
    const personal = await prisma.personalLogistica.findMany();
    return personal.map(p => ({
        id: p.id,
        nombre: p.nombre,
        especialidad: p.especialidad,
        disponibilidad: p.disponibilidad,
        correo: p.correo || undefined
    }));
};
export const addPersonal = async (personal: Personal) => {
    await prisma.personalLogistica.create({
        data: { id: personal.id, nombre: personal.nombre, especialidad: personal.especialidad, disponibilidad: personal.disponibilidad, correo: personal.correo || null }
    });
};
export const updatePersonal = async (personal: Personal) => {
    await prisma.personalLogistica.update({
        where: { id: personal.id },
        data: { nombre: personal.nombre, especialidad: personal.especialidad, disponibilidad: personal.disponibilidad, correo: personal.correo || null }
    });
};
export const deletePersonal = async (id: string) => {
    await prisma.personalLogistica.delete({ where: { id } });
};

// --- RONDAS ---
export const getRondas = async (): Promise<Ronda[]> => {
    const rondas = await prisma.ronda.findMany();
    return rondas.map(r => ({
        id: r.id,
        fecha: r.fecha,
        tipoSalida: r.tipoSalida,
        postaId: r.postaId,
        vehiculoId: r.vehiculoId,
        conductorId: r.conductorId,
        indicaciones: r.indicaciones || undefined,
        horaSalida: r.horaSalida || undefined,
        horaRetorno: r.horaRetorno || undefined,
        accionRetorno: r.accionRetorno || undefined,
        viaticos: r.viaticos ? JSON.parse(r.viaticos) : undefined,
        paradasIntermediasIds: r.paradasIntermediasIds ? JSON.parse(r.paradasIntermediasIds) : [],
        pasajerosIds: r.pasajerosIds ? JSON.parse(r.pasajerosIds) : [],
        solicitudesIds: r.solicitudesIds ? JSON.parse(r.solicitudesIds) : []
    }));
};
export const addRonda = async (ronda: Ronda) => {
    await prisma.ronda.create({
        data: {
            id: ronda.id,
            fecha: ronda.fecha,
            tipoSalida: ronda.tipoSalida,
            postaId: ronda.postaId,
            vehiculoId: ronda.vehiculoId,
            conductorId: ronda.conductorId,
            indicaciones: ronda.indicaciones || null,
            horaSalida: ronda.horaSalida || null,
            horaRetorno: ronda.horaRetorno || null,
            accionRetorno: ronda.accionRetorno || null,
            viaticos: ronda.viaticos ? JSON.stringify(ronda.viaticos) : null,
            paradasIntermediasIds: ronda.paradasIntermediasIds ? JSON.stringify(ronda.paradasIntermediasIds) : null,
            pasajerosIds: ronda.pasajerosIds ? JSON.stringify(ronda.pasajerosIds) : null,
            solicitudesIds: ronda.solicitudesIds ? JSON.stringify(ronda.solicitudesIds) : null
        }
    });
};
export const updateRonda = async (ronda: Ronda) => {
    await prisma.ronda.update({
        where: { id: ronda.id },
        data: {
            fecha: ronda.fecha,
            tipoSalida: ronda.tipoSalida,
            postaId: ronda.postaId,
            vehiculoId: ronda.vehiculoId,
            conductorId: ronda.conductorId,
            indicaciones: ronda.indicaciones || null,
            horaSalida: ronda.horaSalida || null,
            horaRetorno: ronda.horaRetorno || null,
            accionRetorno: ronda.accionRetorno || null,
            viaticos: ronda.viaticos ? JSON.stringify(ronda.viaticos) : null,
            paradasIntermediasIds: ronda.paradasIntermediasIds ? JSON.stringify(ronda.paradasIntermediasIds) : null,
            pasajerosIds: ronda.pasajerosIds ? JSON.stringify(ronda.pasajerosIds) : null,
            solicitudesIds: ronda.solicitudesIds ? JSON.stringify(ronda.solicitudesIds) : null
        }
    });
};
export const deleteRonda = async (id: string) => {
    await prisma.ronda.delete({ where: { id } });
};

// --- SOLICITUDES SALIDA ---
export const getSolicitudes = async (): Promise<SolicitudSalida[]> => {
    const solicitudes = await prisma.solicitudSalida.findMany();
    return solicitudes.map(s => ({
        id: s.id,
        fechaSolicitud: s.fechaSolicitud,
        fechaViaje: s.fechaViaje,
        solicitante: s.solicitante,
        tipoSalida: s.tipoSalida as any,
        destinoId: s.destinoId,
        descripcion: s.descripcion,
        estado: s.estado as any,
        rondaId: s.rondaId || undefined,
        motivoRechazo: s.motivoRechazo || undefined,
        paradasIntermediasIds: s.paradasIntermediasIds ? JSON.parse(s.paradasIntermediasIds) : [],
        funcionariosIds: s.funcionariosIds ? JSON.parse(s.funcionariosIds) : [],
        pacientesIds: s.pacientesIds ? JSON.parse(s.pacientesIds) : []
    }));
};
export const addSolicitud = async (solicitud: SolicitudSalida) => {
    await prisma.solicitudSalida.create({
        data: {
            id: solicitud.id,
            fechaSolicitud: solicitud.fechaSolicitud,
            fechaViaje: solicitud.fechaViaje,
            solicitante: solicitud.solicitante,
            tipoSalida: solicitud.tipoSalida,
            destinoId: solicitud.destinoId,
            descripcion: solicitud.descripcion,
            estado: solicitud.estado,
            rondaId: solicitud.rondaId || null,
            motivoRechazo: solicitud.motivoRechazo || null,
            paradasIntermediasIds: solicitud.paradasIntermediasIds ? JSON.stringify(solicitud.paradasIntermediasIds) : null,
            funcionariosIds: solicitud.funcionariosIds ? JSON.stringify(solicitud.funcionariosIds) : null,
            pacientesIds: solicitud.pacientesIds ? JSON.stringify(solicitud.pacientesIds) : null
        }
    });
};
export const updateSolicitud = async (solicitud: SolicitudSalida) => {
    await prisma.solicitudSalida.update({
        where: { id: solicitud.id },
        data: {
            fechaSolicitud: solicitud.fechaSolicitud,
            fechaViaje: solicitud.fechaViaje,
            solicitante: solicitud.solicitante,
            tipoSalida: solicitud.tipoSalida,
            destinoId: solicitud.destinoId,
            descripcion: solicitud.descripcion,
            estado: solicitud.estado,
            rondaId: solicitud.rondaId || null,
            motivoRechazo: solicitud.motivoRechazo || null,
            paradasIntermediasIds: solicitud.paradasIntermediasIds ? JSON.stringify(solicitud.paradasIntermediasIds) : null,
            funcionariosIds: solicitud.funcionariosIds ? JSON.stringify(solicitud.funcionariosIds) : null,
            pacientesIds: solicitud.pacientesIds ? JSON.stringify(solicitud.pacientesIds) : null
        }
    });
};
export const deleteSolicitud = async (id: string) => {
    await prisma.solicitudSalida.delete({ where: { id } });
};

// --- PACIENTES ---
export const getPacientes = async (): Promise<Paciente[]> => {
    const pacientes = await prisma.pacienteLogistica.findMany();
    return pacientes.map(p => ({
        id: p.id,
        rut: p.rut,
        nombre: p.nombre,
        fechaNacimiento: p.fechaNacimiento,
        sexo: p.sexo as any,
        calle: p.calle,
        numeroDomicilio: p.numeroDomicilio,
        telefonos: p.telefonos ? JSON.parse(p.telefonos) : [],
        sector: p.sector as any,
        establecimientoId: p.establecimientoId,
        urbanoRural: p.urbanoRural as any,
        dependencia: p.dependencia as any
    }));
};
export const addPaciente = async (paciente: Paciente) => {
    await prisma.pacienteLogistica.create({
        data: {
            id: paciente.id,
            rut: paciente.rut,
            nombre: paciente.nombre,
            fechaNacimiento: paciente.fechaNacimiento,
            sexo: paciente.sexo,
            calle: paciente.calle,
            numeroDomicilio: paciente.numeroDomicilio,
            telefonos: paciente.telefonos ? JSON.stringify(paciente.telefonos) : null,
            sector: paciente.sector,
            establecimientoId: paciente.establecimientoId,
            urbanoRural: paciente.urbanoRural,
            dependencia: paciente.dependencia
        }
    });
};
export const updatePaciente = async (paciente: Paciente) => {
    await prisma.pacienteLogistica.update({
        where: { id: paciente.id },
        data: {
            rut: paciente.rut,
            nombre: paciente.nombre,
            fechaNacimiento: paciente.fechaNacimiento,
            sexo: paciente.sexo,
            calle: paciente.calle,
            numeroDomicilio: paciente.numeroDomicilio,
            telefonos: paciente.telefonos ? JSON.stringify(paciente.telefonos) : null,
            sector: paciente.sector,
            establecimientoId: paciente.establecimientoId,
            urbanoRural: paciente.urbanoRural,
            dependencia: paciente.dependencia
        }
    });
};
export const deletePaciente = async (id: string) => {
    await prisma.pacienteLogistica.delete({ where: { id } });
};

// --- ALIAS DE COMPATIBILIDAD ---
export const getPostasFirebase = getPostas;
export const addPostaFirebase = addPosta;
export const updatePostaFirebase = updatePosta;
export const deletePostaFirebase = deletePosta;

export const getVehiculosFirebase = getVehiculos;
export const addVehiculoFirebase = addVehiculo;
export const updateVehiculoFirebase = updateVehiculo;
export const deleteVehiculoFirebase = deleteVehiculo;

export const getPersonalFirebase = getPersonal;
export const addPersonalFirebase = addPersonal;
export const updatePersonalFirebase = updatePersonal;
export const deletePersonalFirebase = deletePersonal;

export const getRondasFirebase = getRondas;
export const addRondaFirebase = addRonda;
export const updateRondaFirebase = updateRonda;
export const deleteRondaFirebase = deleteRonda;

export const getSolicitudesFirebase = getSolicitudes;
export const addSolicitudFirebase = addSolicitud;
export const updateSolicitudFirebase = updateSolicitud;
export const deleteSolicitudFirebase = deleteSolicitud;

export const getPacientesFirebase = getPacientes;
export const addPacienteFirebase = addPaciente;
export const updatePacienteFirebase = updatePaciente;
export const deletePacienteFirebase = deletePaciente;
