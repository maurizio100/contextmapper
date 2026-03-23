import { toPng } from 'html-to-image';
import type { ReactFlowInstance } from '@xyflow/react';

export async function exportToPng(reactFlowInstance: ReactFlowInstance) {
  // Fit view first so everything is visible
  reactFlowInstance.fitView({ padding: 0.2 });

  // Small delay for the fitView animation to settle
  await new Promise((r) => setTimeout(r, 200));

  const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
  if (!viewport) return;

  const dataUrl = await toPng(viewport, {
    backgroundColor: '#f9fafb',
    pixelRatio: 2,
    filter: (node) => {
      // Exclude minimap, controls, and attribution from the export
      if (node.classList?.contains('react-flow__minimap')) return false;
      if (node.classList?.contains('react-flow__controls')) return false;
      if (node.classList?.contains('react-flow__attribution')) return false;
      return true;
    },
  });

  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = 'context-map.png';
  a.click();
}
