export class CreateInitiativeDto {
  ruta: string;
  subtema?: string;
  tipo: string;
  autor: string;
  url: string;
  publicoObjetivo?: string;
  priorizacion?: string;
  nivel?: string;
  tags?: string[];
  es: string; // JSON string { title, description }
  en?: string; // JSON string { title, description }
  startDate?: Date;
  endDate?: Date;
  created_By?: string;
}

export class UpdateInitiativeDto {
  ruta?: string;
  subtema?: string;
  tipo?: string;
  autor?: string;
  url?: string;
  publicoObjetivo?: string;
  priorizacion?: string;
  nivel?: string;
  tags?: string[];
  es?: string;
  en?: string;
  status?: boolean;
  startDate?: Date;
  endDate?: Date;
  updated_By?: string;
}
