import { RelationshipType } from '../types/context-map';

export interface RelationshipMeta {
  label: string;
  abbreviation: string;
  description: string;
  symmetric: boolean;
}

export const RELATIONSHIP_META: Record<RelationshipType, RelationshipMeta> = {
  [RelationshipType.SharedKernel]: {
    label: 'Shared Kernel',
    abbreviation: 'SK',
    description: 'Two contexts share a common subset of the domain model',
    symmetric: true,
  },
  [RelationshipType.CustomerSupplier]: {
    label: 'Customer-Supplier',
    abbreviation: 'CS',
    description: 'Upstream supplies what downstream needs; downstream provides feedback',
    symmetric: false,
  },
  [RelationshipType.Conformist]: {
    label: 'Conformist',
    abbreviation: 'CF',
    description: 'Downstream conforms to the upstream model without influence',
    symmetric: false,
  },
  [RelationshipType.AnticorruptionLayer]: {
    label: 'Anticorruption Layer',
    abbreviation: 'ACL',
    description: 'Downstream translates upstream model to protect its own model',
    symmetric: false,
  },
  [RelationshipType.OpenHostService]: {
    label: 'Open Host Service',
    abbreviation: 'OHS',
    description: 'Upstream provides a well-defined protocol/API for consumers',
    symmetric: false,
  },
  [RelationshipType.PublishedLanguage]: {
    label: 'Published Language',
    abbreviation: 'PL',
    description: 'A shared language (schema/format) used for integration',
    symmetric: false,
  },
  [RelationshipType.Partnership]: {
    label: 'Partnership',
    abbreviation: 'PT',
    description: 'Two contexts cooperate, evolving together with mutual dependency',
    symmetric: true,
  },
  [RelationshipType.SeparateWays]: {
    label: 'Separate Ways',
    abbreviation: 'SW',
    description: 'Contexts have no integration; each goes its own way',
    symmetric: true,
  },
  [RelationshipType.BigBallOfMud]: {
    label: 'Big Ball of Mud',
    abbreviation: 'BBoM',
    description: 'A large, poorly defined context with mixed responsibilities',
    symmetric: true,
  },
};

export const CONTEXT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];
