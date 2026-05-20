import type {
  BoundedContextNode,
  RelationshipEdge,
  RelationshipData,
  RelationshipType,
} from '../types/context-map';
import { CONTEXT_COLORS, RELATIONSHIP_META } from '../constants/relationships';
import { generateId } from './id-generator';

export interface ImportResult {
  nodes: BoundedContextNode[];
  edges: RelationshipEdge[];
  warnings: string[];
}

const NODE_WIDTH = 180;
const NODE_HEIGHT = 80;
const NODE_GAP_X = 80;
const NODE_GAP_Y = 60;

function gridPosition(index: number, total: number): { x: number; y: number } {
  const cols = Math.max(1, Math.ceil(Math.sqrt(total)));
  const col = index % cols;
  const row = Math.floor(index / cols);
  return {
    x: col * (NODE_WIDTH + NODE_GAP_X),
    y: row * (NODE_HEIGHT + NODE_GAP_Y),
  };
}

function abbreviationToType(): Map<string, RelationshipType> {
  const map = new Map<string, RelationshipType>();
  (Object.keys(RELATIONSHIP_META) as RelationshipType[]).forEach((type) => {
    map.set(RELATIONSHIP_META[type].abbreviation.toLowerCase(), type);
  });
  return map;
}

function splitTableRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return trimmed.split('|').map((c) => c.trim());
}

function isDividerRow(line: string): boolean {
  return /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(line.trim());
}

function parseContexts(lines: string[]): {
  nodes: BoundedContextNode[];
  byName: Map<string, string>;
  warnings: string[];
} {
  const nodes: BoundedContextNode[] = [];
  const byName = new Map<string, string>();
  const warnings: string[] = [];

  let inSection = false;
  let pending: { name: string; description: string } | null = null;

  const flush = () => {
    if (!pending) return;
    if (byName.has(pending.name.toLowerCase())) {
      warnings.push(`Duplicate context name "${pending.name}" — keeping first.`);
      pending = null;
      return;
    }
    const id = generateId();
    byName.set(pending.name.toLowerCase(), id);
    nodes.push({
      id,
      type: 'boundedContext',
      position: { x: 0, y: 0 },
      data: {
        name: pending.name,
        description: pending.description,
        color: CONTEXT_COLORS[nodes.length % CONTEXT_COLORS.length],
      },
    });
    pending = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (/^##\s+/.test(line)) {
      const heading = line.replace(/^##\s+/, '').trim().toLowerCase();
      if (heading === 'bounded contexts') {
        inSection = true;
        continue;
      }
      flush();
      inSection = false;
      continue;
    }

    if (!inSection) continue;

    const ctxMatch = line.match(/^###\s+(?:\d+\.\s+)?(.+?)\s*$/);
    if (ctxMatch) {
      flush();
      pending = { name: ctxMatch[1].trim(), description: '' };
      continue;
    }

    if (pending) {
      const quoteMatch = line.match(/^>\s?(.*)$/);
      if (quoteMatch) {
        pending.description = pending.description
          ? `${pending.description}\n${quoteMatch[1]}`
          : quoteMatch[1];
      }
    }
  }

  flush();
  return { nodes, byName, warnings };
}

function parseRelationships(
  lines: string[],
  byName: Map<string, string>
): { edges: RelationshipEdge[]; warnings: string[] } {
  const edges: RelationshipEdge[] = [];
  const warnings: string[] = [];
  const abbrMap = abbreviationToType();

  // Find the ## Relationships block boundaries
  let startIdx = -1;
  let endIdx = lines.length;
  for (let i = 0; i < lines.length; i++) {
    if (/^##\s+relationships\s*$/i.test(lines[i].trim())) {
      startIdx = i + 1;
    } else if (startIdx !== -1 && /^##\s+/.test(lines[i])) {
      endIdx = i;
      break;
    }
  }
  if (startIdx === -1) return { edges, warnings };

  const block = lines.slice(startIdx, endIdx);

  // Locate the directional table (before any `### Symmetric Relationships`)
  // and the symmetric table (after that subheading, if present).
  let symmetricStart = block.length;
  for (let i = 0; i < block.length; i++) {
    if (/^###\s+symmetric\s+relationships\s*$/i.test(block[i].trim())) {
      symmetricStart = i;
      break;
    }
  }

  const directionalLines = block.slice(0, symmetricStart);
  const symmetricLines = block.slice(symmetricStart);

  const extractTable = (segment: string[]): string[][] | null => {
    let collecting = false;
    const rows: string[][] = [];
    for (let i = 0; i < segment.length; i++) {
      const line = segment[i];
      if (line.trim().startsWith('|')) {
        if (!collecting) {
          const header = splitTableRow(line);
          if (isDividerRow(segment[i + 1] ?? '')) {
            rows.push(header);
            collecting = true;
            i += 1;
          }
        } else {
          rows.push(splitTableRow(line));
        }
      } else if (collecting && line.trim() === '') {
        break;
      }
    }
    return rows.length > 1 ? rows : null;
  };

  const resolve = (name: string): string | null => {
    return byName.get(name.toLowerCase()) ?? null;
  };

  const parseTypeCell = (cell: string): {
    base: RelationshipType | null;
    upstreamType: RelationshipType | null;
    downstreamType: RelationshipType | null;
  } => {
    let base: RelationshipType | null = null;
    let upstreamType: RelationshipType | null = null;
    let downstreamType: RelationshipType | null = null;

    // Parse U:OHS and D:ACL tokens
    const sidePattern = /\b([UD]):([A-Za-z]+)\b/g;
    let match;
    while ((match = sidePattern.exec(cell)) !== null) {
      const side = match[1];
      const abbr = match[2].toLowerCase();
      const type = abbrMap.get(abbr) ?? null;
      if (side === 'U') upstreamType = type;
      else downstreamType = type;
    }

    // Parse base type from the paren abbreviation
    const parenMatch = cell.match(/\(([^)]+)\)/);
    if (parenMatch) {
      const abbr = parenMatch[1].trim().toLowerCase();
      base = abbrMap.get(abbr) ?? null;
    }
    if (!base) {
      const lower = cell.trim().toLowerCase();
      for (const [type, meta] of Object.entries(RELATIONSHIP_META)) {
        if (lower.startsWith(meta.label.toLowerCase())) {
          base = type as RelationshipType;
          break;
        }
      }
    }

    return { base, upstreamType, downstreamType };
  };

  const cleanNotes = (cell: string): string => {
    const t = cell.trim();
    return t === '-' || t === '' ? '' : t;
  };

  // Directional: | # | Upstream | Downstream | Type | Notes |
  const dirTable = extractTable(directionalLines);
  if (dirTable) {
    const header = dirTable[0].map((h) => h.toLowerCase());
    const upIdx = header.findIndex((h) => h.includes('upstream'));
    const downIdx = header.findIndex((h) => h.includes('downstream'));
    const typeIdx = header.findIndex((h) => h.includes('type'));
    const notesIdx = header.findIndex((h) => h.includes('notes'));

    if (upIdx === -1 || downIdx === -1 || typeIdx === -1) {
      warnings.push('Directional relationships table is missing required columns.');
    } else {
      for (let r = 1; r < dirTable.length; r++) {
        const row = dirTable[r];
        const upstreamName = row[upIdx] ?? '';
        const downstreamName = row[downIdx] ?? '';
        const typeCell = row[typeIdx] ?? '';
        const notes = notesIdx >= 0 ? cleanNotes(row[notesIdx] ?? '') : '';

        const sourceId = resolve(upstreamName);
        const targetId = resolve(downstreamName);
        const { base, upstreamType, downstreamType } = parseTypeCell(typeCell);

        if (!sourceId || !targetId) {
          warnings.push(
            `Skipped relationship: unknown context "${!sourceId ? upstreamName : downstreamName}".`
          );
          continue;
        }
        if (!base) {
          warnings.push(`Skipped relationship: unknown type "${typeCell}".`);
          continue;
        }

        const data: RelationshipData = {
          relationshipType: base,
          upstreamType: upstreamType ?? null,
          downstreamType: downstreamType ?? null,
          sourceRole: 'upstream',
          targetRole: 'downstream',
          notes,
        };
        edges.push({
          id: generateId(),
          source: sourceId,
          target: targetId,
          type: 'relationship',
          data,
        });
      }
    }
  }

  // Symmetric: | # | Context A | Context B | Type | Notes |
  const symTable = extractTable(symmetricLines);
  if (symTable) {
    const header = symTable[0].map((h) => h.toLowerCase());
    const aIdx = header.findIndex((h) => h.includes('context a') || h === 'a');
    const bIdx = header.findIndex((h) => h.includes('context b') || h === 'b');
    const typeIdx = header.findIndex((h) => h.includes('type'));
    const notesIdx = header.findIndex((h) => h.includes('notes'));

    if (aIdx === -1 || bIdx === -1 || typeIdx === -1) {
      warnings.push('Symmetric relationships table is missing required columns.');
    } else {
      for (let r = 1; r < symTable.length; r++) {
        const row = symTable[r];
        const aName = row[aIdx] ?? '';
        const bName = row[bIdx] ?? '';
        const typeCell = row[typeIdx] ?? '';
        const notes = notesIdx >= 0 ? cleanNotes(row[notesIdx] ?? '') : '';

        const sourceId = resolve(aName);
        const targetId = resolve(bName);
        const { base } = parseTypeCell(typeCell);

        if (!sourceId || !targetId) {
          warnings.push(
            `Skipped symmetric relationship: unknown context "${!sourceId ? aName : bName}".`
          );
          continue;
        }
        if (!base) {
          warnings.push(`Skipped symmetric relationship: unknown type "${typeCell}".`);
          continue;
        }

        const data: RelationshipData = {
          relationshipType: base,
          sourceRole: 'none',
          targetRole: 'none',
          notes,
        };
        edges.push({
          id: generateId(),
          source: sourceId,
          target: targetId,
          type: 'relationship',
          data,
        });
      }
    }
  }

  return { edges, warnings };
}

export function parseMarkdown(content: string): ImportResult {
  const lines = content.replace(/\r\n/g, '\n').split('\n');

  const { nodes, byName, warnings: ctxWarnings } = parseContexts(lines);
  const { edges, warnings: relWarnings } = parseRelationships(lines, byName);

  // Lay out nodes in a grid since markdown carries no positions.
  nodes.forEach((node, i) => {
    node.position = gridPosition(i, nodes.length);
  });

  return {
    nodes,
    edges,
    warnings: [...ctxWarnings, ...relWarnings],
  };
}
