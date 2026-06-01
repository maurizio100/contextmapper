import type { BoundedContextNode, RelationshipEdge, RelationshipData } from '../types/context-map';
import { RELATIONSHIP_META } from '../constants/relationships';

function getNodeName(nodes: BoundedContextNode[], id: string): string {
  return nodes.find((n) => n.id === id)?.data.name ?? 'Unknown';
}

export function generateMarkdown(
  nodes: BoundedContextNode[],
  edges: RelationshipEdge[]
): string {
  const lines: string[] = [];

  lines.push('# Context Map\n');

  // Bounded Contexts
  lines.push('## Bounded Contexts\n');
  nodes.forEach((node, i) => {
    lines.push(`### ${i + 1}. ${node.data.name}`);
    if (node.data.description) {
      lines.push(`> ${node.data.description}`);
    }
    lines.push('');
  });

  lines.push('---\n');

  // Split edges into directional and symmetric
  const directional: RelationshipEdge[] = [];
  const symmetric: RelationshipEdge[] = [];

  edges.forEach((edge) => {
    const data = edge.data as RelationshipData;
    const meta = RELATIONSHIP_META[data.relationshipType];
    if (meta.symmetric) {
      symmetric.push(edge);
    } else {
      directional.push(edge);
    }
  });

  // Directional relationships
  lines.push('## Relationships\n');
  if (directional.length > 0) {
    lines.push('| # | Upstream | Downstream | Type | Clarity | Notes |');
    lines.push('|---|----------|------------|------|---------|-------|');
    directional.forEach((edge, i) => {
      const data = edge.data as RelationshipData;
      const baseMeta = RELATIONSHIP_META[data.relationshipType];
      const upstreamId = data.sourceRole === 'upstream' ? edge.source : edge.target;
      const downstreamId = data.sourceRole === 'upstream' ? edge.target : edge.source;
      const upstream = getNodeName(nodes, upstreamId);
      const downstream = getNodeName(nodes, downstreamId);

      // Build type cell: show base + side patterns when present
      const parts: string[] = [`${baseMeta.label} (${baseMeta.abbreviation})`];
      if (data.upstreamType) {
        const m = RELATIONSHIP_META[data.upstreamType];
        parts.push(`U:${m.abbreviation}`);
      }
      if (data.downstreamType) {
        const m = RELATIONSHIP_META[data.downstreamType];
        parts.push(`D:${m.abbreviation}`);
      }
      lines.push(
        `| ${i + 1} | ${upstream} | ${downstream} | ${parts.join(' ')} | ${data.clarity ?? '-'} | ${data.notes || '-'} |`
      );
    });
    lines.push('');
  } else {
    lines.push('_No directional relationships._\n');
  }

  // Symmetric relationships
  if (symmetric.length > 0) {
    lines.push('### Symmetric Relationships\n');
    lines.push('| # | Context A | Context B | Type | Clarity | Notes |');
    lines.push('|---|-----------|-----------|------|---------|-------|');
    symmetric.forEach((edge, i) => {
      const data = edge.data as RelationshipData;
      const meta = RELATIONSHIP_META[data.relationshipType];
      const a = getNodeName(nodes, edge.source);
      const b = getNodeName(nodes, edge.target);
      lines.push(
        `| ${i + 1} | ${a} | ${b} | ${meta.label} (${meta.abbreviation}) | ${data.clarity ?? '-'} | ${data.notes || '-'} |`
      );
    });
    lines.push('');
  }

  lines.push('---\n');

  // Summary
  lines.push('## Summary\n');
  lines.push(`- **Total Bounded Contexts:** ${nodes.length}`);
  lines.push(`- **Total Relationships:** ${edges.length}`);

  if (edges.length > 0) {
    const breakdown: Record<string, number> = {};
    edges.forEach((edge) => {
      const data = edge.data as RelationshipData;
      const meta = RELATIONSHIP_META[data.relationshipType];
      breakdown[meta.label] = (breakdown[meta.label] ?? 0) + 1;
    });
    const parts = Object.entries(breakdown)
      .map(([label, count]) => `${label}: ${count}`)
      .join(', ');
    lines.push(`- **Relationship Breakdown:** ${parts}`);
  }

  lines.push('');
  return lines.join('\n');
}

export function downloadMarkdown(content: string, filename = 'context-map.md') {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
