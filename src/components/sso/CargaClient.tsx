"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import { UploadCloud, FileSpreadsheet, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { bulkInsertDemands, deleteAllDemands } from "@/app/sso/admin/carga/actions";

// --- Normalization Logic ---

const _POLICLINICOS_PATTERNS: Record<string, string[]> = {
  'MEDICINA':      ['MEDIC', 'MORBILIDAD'],
  'MATRONERIA':    ['MATRON', 'GINE', 'OBSTET'],
  'KINESIOLOGIA':  ['KINESIO', 'REHAB'],
  'ENFERMERIA':    ['ENFERM'],
  'PSICOLOGIA':    ['PSICOL', 'PSIQ', 'SALUD MENTAL'],
  'ODONTOLOGIA':   ['ODONTO', 'DENT'],
  'NUTRICION':     ['NUTRI'],
  'FONOAUDIOLOGIA':['FONO'],
  'TERAPIA':       ['TERAP', 'OCUPAC'],
  'SOCIAL':        ['ASISTENTE SOCIAL', 'TRABAJO SOCIAL'],
  'PODOLOGIA':     ['PODOL', 'PODIAT'],
};

function normalizePoliclinic(name: string | null | undefined): string {
  if (!name || name.trim() === "") return "";
  
  const originalStr = name.trim();
  const cleanName = originalStr.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  
  for (const [category, patterns] of Object.entries(_POLICLINICOS_PATTERNS)) {
    for (const pattern of patterns) {
      if (new RegExp(pattern).test(cleanName)) {
        return category;
      }
    }
  }
  
  return originalStr.charAt(0).toUpperCase() + originalStr.slice(1).toLowerCase();
}

function normalizeRut(rutRaw: string | number): string {
  if (!rutRaw) return "";
  const str = String(rutRaw).replace(/[^0-9Kk]/g, '').toUpperCase();
  if (str.length < 2) return str;
  const num = str.slice(0, -1);
  const dv = str.slice(-1);
  return `${num}-${dv}`;
}

function parseExcelDate(value: any): string | null {
  if (!value) return null;
  
  // Si es un número (formato serial de Excel)
  if (typeof value === 'number') {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const dateObj = new Date(excelEpoch.getTime() + value * 86400000);
    return dateObj.toISOString();
  }
  
  // Si es string (ej: "15-05-2023" o "15/05/2023")
  if (typeof value === 'string') {
    const parts = value.split(/[-/]/);
    if (parts.length === 3) {
      let day = parseInt(parts[0], 10);
      let month = parseInt(parts[1], 10) - 1;
      let year = parseInt(parts[2], 10);
      // Asumir DD-MM-YYYY
      if (year < 100) year += 2000;
      return new Date(Date.UTC(year, month, day)).toISOString();
    }
    // Intento general
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return null;
}

function calculatePriority(dateString: string | null): string {
  if (!dateString) return "Baja";
  const dateObj = new Date(dateString);
  const today = new Date();
  
  const utcDate = Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate());
  const utcToday = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  
  const diffDays = Math.floor((utcToday - utcDate) / (1000 * 60 * 60 * 24));
  
  if (diffDays > 30) return "Alta";
  if (diffDays > 15) return "Media";
  return "Baja";
}

function safeStr(val: any): string {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

function normalizeColName(name: string): string {
  return safeStr(name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
}

export default function CargaClient() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<any[] | null>(null);
  const [originType, setOriginType] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDanger, setShowDanger] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setLoading(true);
    
    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
      
      if (jsonData.length === 0) {
        toast.error("El archivo está vacío");
        setLoading(false);
        return;
      }

      // Obtener columnas normalizadas
      const firstRow = jsonData[0] as Record<string, any>;
      const colMap = new Map<string, string>();
      Object.keys(firstRow).forEach(k => {
        colMap.set(normalizeColName(k), k);
      });

      const _col = (name: string) => colMap.get(normalizeColName(name));

      let mappedData: any[] = [];
      let detectedOrigin = "";

      if (_col("Agrupación") || _col("Agrupacion")) {
        detectedOrigin = "Derivación Interna";
        mappedData = jsonData.map((row: any) => {
          const colFecha = _col("Fecha Derivación") || _col("Fecha Derivacion");
          const requestDate = parseExcelDate(colFecha ? row[colFecha] : null);
          
          const colRut = _col("Rut Paciente") || _col("Rut");
          const rut = normalizeRut(colRut ? row[colRut] : "");
          
          const colNombre = _col("Nombre Paciente") || _col("Nombre");
          const fullName = safeStr(colNombre ? row[colNombre] : "").toUpperCase();
          
          const colPrioridad = _col("Prioridad");
          let prioridad = colPrioridad ? safeStr(row[colPrioridad]).charAt(0).toUpperCase() + safeStr(row[colPrioridad]).slice(1).toLowerCase() : "Baja";
          if (!["Alta", "Media", "Baja"].includes(prioridad)) prioridad = "Baja";
          
          const colGrupo = _col("Agrupación") || _col("Agrupacion");
          const policlinic = normalizePoliclinic(colGrupo ? row[colGrupo] : "");
          
          const colMotivo = _col("Motivo") || _col("Observacion") || _col("Observación");
          const observation = safeStr(colMotivo ? row[colMotivo] : "");
          
          const colPlazo = _col("Plazo");
          let plazo = safeStr(colPlazo ? row[colPlazo] : "");
          if (plazo && !/\d/.test(plazo)) {
            plazo = "";
          }

          return {
            rut,
            full_name: fullName,
            age: null,
            request_date: requestDate,
            origin: "Derivación Interna",
            policlinic,
            establishment: "CESFAM Futrono",
            attention_type: "CONTROL",
            pregnancy: "NONE",
            observation,
            priority: prioridad,
            status: "📋 Pendiente",
            plazo
          };
        });

      } else if (_col("FECHA RECHAZO")) {
        detectedOrigin = "Rechazo";
        mappedData = jsonData.map((row: any) => {
          const fechaRechazo = _col("FECHA RECHAZO") ? row[_col("FECHA RECHAZO") as string] : null;
          const requestDate = parseExcelDate(fechaRechazo);
          const priority = calculatePriority(requestDate);
          
          const rutNum = safeStr(_col("RUT") ? row[_col("RUT") as string] : "");
          const dv = safeStr(_col("DV") ? row[_col("DV") as string] : "");
          const rut = rutNum && dv ? `${rutNum}-${dv}` : normalizeRut(rutNum);
          
          const nombres = safeStr(_col("NOMBRES") ? row[_col("NOMBRES") as string] : "");
          const paterno = safeStr(_col("APELLIDO PATERNO") ? row[_col("APELLIDO PATERNO") as string] : "");
          const materno = safeStr(_col("APELLIDO MATERNO") ? row[_col("APELLIDO MATERNO") as string] : "");
          const fullName = `${nombres} ${paterno} ${materno}`.trim().toUpperCase();
          
          const colEdad = _col("EDAD A");
          const age = colEdad ? parseInt(row[colEdad], 10) : null;
          
          const colPoli = _col("POLICLINICO");
          const policlinic = normalizePoliclinic(colPoli ? row[colPoli] : "");
          
          const colEstab = _col("ESTABLECIMIENTO");
          const establishment = safeStr(colEstab ? row[colEstab] : "CESFAM Futrono");
          
          const colTipo = _col("TIPO ATENCION");
          const attentionType = safeStr(colTipo ? row[colTipo] : "CONTROL");
          
          const colEmb = _col("EMBARAZO");
          const embarazoRaw = safeStr(colEmb ? row[colEmb] : "");
          const pregnancy = embarazoRaw ? embarazoRaw : "NONE";
          
          const colObs = _col("OBSERVACION");
          const observation = safeStr(colObs ? row[colObs] : "");

          return {
            rut,
            full_name: fullName,
            age: isNaN(age as number) ? null : age,
            request_date: requestDate,
            origin: "Rechazo",
            policlinic,
            establishment,
            attention_type: attentionType,
            pregnancy,
            observation,
            priority,
            status: "📋 Pendiente",
            plazo: ""
          };
        });
      } else {
        toast.error("Formato no reconocido. Asegúrese de subir el formato correcto.");
        setLoading(false);
        return;
      }

      setOriginType(detectedOrigin);
      setParsedData(mappedData.filter(d => d.rut && d.full_name)); // Filtrar vacíos

    } catch (error) {
      console.error(error);
      toast.error("Error al procesar el archivo Excel.");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleSaveToDB = async () => {
    if (!parsedData || parsedData.length === 0) return;
    const savePromise = bulkInsertDemands(parsedData);
    
    toast.promise(savePromise, {
      loading: 'Guardando en base de datos...',
      success: (res) => {
        if (res.success) {
          setFile(null);
          setParsedData(null);
          return `Guardado exitoso. ${res.count} registros insertados/actualizados.`;
        } else {
          throw new Error(res.error);
        }
      },
      error: (err) => `Error al guardar: ${err.message}`,
    });
  };

  const handleDeleteAll = async () => {
    const deletePromise = deleteAllDemands();
    toast.promise(deletePromise, {
      loading: 'Eliminando base de datos...',
      success: (res) => {
        if (res.success) {
          setShowDanger(false);
          return 'Todos los registros han sido eliminados.';
        } else {
          throw new Error(res.error);
        }
      },
      error: 'Error al eliminar',
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <UploadCloud className="h-6 w-6 text-blue-600" />
          Subir Archivo de Datos
        </h2>

        {!file && (
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
              isDragging 
                ? "border-blue-500 bg-blue-50" 
                : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex justify-center mb-4">
              <FileSpreadsheet className={`h-12 w-12 ${isDragging ? "text-blue-500" : "text-slate-400"}`} />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">Arrastra tu archivo aquí</h3>
            <p className="text-sm text-slate-500 mb-6">o haz clic para seleccionar (formatos .xlsx, .xls, .csv)</p>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
            />
            <button className="px-6 py-2 bg-slate-900 text-white font-bold rounded-xl shadow-sm hover:bg-slate-800 transition-colors">
              Seleccionar Archivo
            </button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center p-12">
            <div className="h-8 w-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="font-bold text-slate-600">Procesando archivo...</p>
          </div>
        )}

        {file && parsedData && !loading && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                  <div>
                    <h3 className="font-bold text-emerald-900 text-lg">Archivo procesado con éxito</h3>
                    <p className="text-emerald-700 text-sm">
                      Se detectó formato de <strong>{originType}</strong> con <strong>{parsedData.length}</strong> registros válidos.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => { setFile(null); setParsedData(null); }}
                  className="text-sm font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>

            <button 
              onClick={handleSaveToDB}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <UploadCloud className="h-5 w-5" />
              Guardar {parsedData.length} registros en la Base de Datos
            </button>
          </div>
        )}
      </div>

      {/* Zona de Peligro */}
      <div className="border border-red-200 bg-red-50/50 rounded-2xl p-8">
        <h2 className="text-xl font-bold text-red-700 mb-2 flex items-center gap-2">
          <AlertTriangle className="h-6 w-6" />
          Zona de Peligro
        </h2>
        <p className="text-red-600/80 mb-6 text-sm">Estas acciones son irreversibles y afectarán a todos los usuarios del sistema.</p>
        
        {!showDanger ? (
          <button 
            onClick={() => setShowDanger(true)}
            className="px-6 py-3 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 hover:border-red-300 transition-colors flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Borrar Todos los Datos
          </button>
        ) : (
          <div className="bg-white p-6 rounded-xl border border-red-200 shadow-sm animate-in zoom-in-95 duration-200">
            <p className="font-bold text-slate-800 mb-2">¿Estás absolutamente seguro?</p>
            <p className="text-sm text-slate-500 mb-6">Esto eliminará TODOS los registros de rechazos y derivaciones de la base de datos. No se puede deshacer.</p>
            <div className="flex gap-3">
              <button 
                onClick={handleDeleteAll}
                className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
              >
                Sí, eliminar todo
              </button>
              <button 
                onClick={() => setShowDanger(false)}
                className="px-6 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
