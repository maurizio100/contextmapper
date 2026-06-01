import type { Node, Edge } from '@xyflow/react';

export const RelationshipType = {
  SharedKernel: 'SharedKernel',
  CustomerSupplier: 'CustomerSupplier',
  Conformist: 'Conformist',
  AnticorruptionLayer: 'AnticorruptionLayer',
  OpenHostService: 'OpenHostService',
  PublishedLanguage: 'PublishedLanguage',
  Partnership: 'Partnership',
  SeparateWays: 'SeparateWays',
  BigBallOfMud: 'BigBallOfMud',
} as const;

export type RelationshipType =
  (typeof RelationshipType)[keyof typeof RelationshipType];

export type Role = 'upstream' | 'downstream' | 'none';

export type Clarity = 'clear' | 'unsure' | 'needs-improvement';

export interface BoundedContextData {
  [key: string]: unknown;
  name: string;
  description: string;
  color: string;
}

export interface ControlOffset {
  x: number;
  y: number;
}

export interface RelationshipData {
  [key: string]: unknown;
  relationshipType: RelationshipType;
  upstreamType?: RelationshipType | null;
  downstreamType?: RelationshipType | null;
  sourceRole: Role;
  targetRole: Role;
  notes: string;
  controlOffset?: ControlOffset;
  clarity?: Clarity;
}

export type BoundedContextNode = Node<BoundedContextData, 'boundedContext'>;
export type RelationshipEdge = Edge<RelationshipData>;

export interface PendingConnection {
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}
