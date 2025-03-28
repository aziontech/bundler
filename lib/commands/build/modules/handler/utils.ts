import { BuildEntryPoint } from 'azion/config';

/**
 * Normalizes entry points to a consistent array format
 */
export const normalizeEntryPaths = (entry: BuildEntryPoint): string[] => {
  if (!entry) return [];
  if (typeof entry === 'string') return [entry];
  if (Array.isArray(entry)) return entry;
  return Object.values(entry);
};
