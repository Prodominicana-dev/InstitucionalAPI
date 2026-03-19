import * as fs from 'fs/promises';
import * as path from 'path';

const FORMULARIOS_FILE = path.join(process.cwd(), 'event-forms', 'formularios.json');


async function ensureFileExists(): Promise<void> {
  try {
    await fs.access(FORMULARIOS_FILE);
  } catch {
    // Si no existe, crear carpeta y archivo
    const dir = path.dirname(FORMULARIOS_FILE);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(FORMULARIOS_FILE, '{}');
    // console.log('✅ Archivo formularios.json creado automáticamente');
  }
}

// Leer todos los formularios
export async function leerFormularios(): Promise<Record<string, string>> {
  try {
    const fileContent = await fs.readFile(FORMULARIOS_FILE, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    return {};
  }
}

// Guardar formulario
export async function guardarFormulario(eventoId: string, url: string): Promise<void> {
  const formularios = await leerFormularios();
  formularios[eventoId] = url;
  await fs.writeFile(FORMULARIOS_FILE, JSON.stringify(formularios, null, 2));
}

// Obtener formulario de un evento
export async function obtenerFormulario(eventoId: string): Promise<string | null> {
  const formularios = await leerFormularios();
  return formularios[eventoId] || null;
}

// Eliminar formulario
export async function eliminarFormulario(eventoId: string): Promise<void> {
  const formularios = await leerFormularios();
  delete formularios[eventoId];
  await fs.writeFile(FORMULARIOS_FILE, JSON.stringify(formularios, null, 2));
}