import type { DomainClassification } from '../types/context-map';

export const DOMAIN_CLASSIFICATIONS: DomainClassification[] = ['core', 'supporting', 'generic'];

export const CLASSIFICATION_LABELS: Record<DomainClassification, string> = {
  core: 'Core',
  supporting: 'Supporting',
  generic: 'Generic',
};
