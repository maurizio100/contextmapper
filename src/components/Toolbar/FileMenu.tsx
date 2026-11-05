import Menu from '../ui/Menu';

interface FileMenuProps {
  onImport: () => void;
  onExport: () => void;
  onImportJson: () => void;
  onExportJson: () => void;
  onExportPng: () => void;
}

/** The toolbar's File menu: whole-document import/export actions, grouped. */
export default function FileMenu({
  onImport,
  onExport,
  onImportJson,
  onExportJson,
  onExportPng,
}: FileMenuProps) {
  return (
    <Menu
      label="File"
      className="px-3 py-2 rounded-lg shadow-sm"
      groups={[
        {
          label: 'Import',
          items: [
            { label: 'Import Markdown', onSelect: onImport },
            { label: 'Import JSON', onSelect: onImportJson },
          ],
        },
        {
          label: 'Export',
          items: [
            { label: 'Export to Markdown', onSelect: onExport },
            { label: 'Export JSON', onSelect: onExportJson },
            { label: 'Export to PNG', onSelect: onExportPng },
          ],
        },
      ]}
    />
  );
}
