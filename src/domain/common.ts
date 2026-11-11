/** Metadatos que comparten todos los registros del usuario, pensados para el sync de la v2. */
export interface SyncMeta {
  /** UUID generado en el dispositivo (o un id fijo conocido, como el de "Efectivo"). */
  id: string;
  /** ISO 8601 UTC; no cambia nunca. */
  createdAt: string;
  /** ISO 8601 UTC; cambia en cada edición, archivado o eliminación. */
  updatedAt: string;
  /** ISO 8601 UTC del borrado lógico; `null` si está vigente. */
  deletedAt: string | null;
}

/** Resultado de una validación: el valor normalizado o los errores por campo (códigos, no textos). */
export type Validation<T, F extends string> =
  { ok: true; value: T } | { ok: false; errors: Partial<Record<F, string>> };

export const isDeleted = (r: { deletedAt: string | null }): boolean => r.deletedAt !== null;
