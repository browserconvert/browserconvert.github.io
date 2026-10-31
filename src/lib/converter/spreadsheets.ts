import * as XLSX from 'xlsx';

export async function convertSpreadsheet(
  file: File | Blob,
  sourceFormat: string,
  targetFormat: string,
  onProgress?: (progress: number, message: string) => void
): Promise<Blob> {
  onProgress?.(15, 'Reading spreadsheet binary data...');
  const arrayBuffer = await file.arrayBuffer();

  onProgress?.(45, 'Parsing sheets in local memory...');
  let workbook: XLSX.WorkBook;

  const src = sourceFormat.toUpperCase();
  const tgt = targetFormat.toUpperCase();

  if (src === 'JSON') {
    const text = new TextDecoder().decode(arrayBuffer);
    const parsed = JSON.parse(text);
    const dataArray = Array.isArray(parsed) ? parsed : [parsed];
    const worksheet = XLSX.utils.json_to_sheet(dataArray);
    workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  } else {
    workbook = XLSX.read(arrayBuffer, { type: 'array' });
  }

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  onProgress?.(75, `Transforming to ${tgt}...`);

  if (tgt === 'CSV') {
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    onProgress?.(100, 'CSV export complete!');
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  }

  if (tgt === 'JSON') {
    const jsonContent = XLSX.utils.sheet_to_json(worksheet);
    const formatted = JSON.stringify(jsonContent, null, 2);
    onProgress?.(100, 'JSON export complete!');
    return new Blob([formatted], { type: 'application/json;charset=utf-8' });
  }

  if (tgt === 'XLSX') {
    const outputBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    onProgress?.(100, 'Excel XLSX export complete!');
    return new Blob([outputBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  if (tgt === 'HTML') {
    const htmlTable = XLSX.utils.sheet_to_html(worksheet);
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Spreadsheet Table</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #333; }
    table { border-collapse: collapse; width: 100%; margin-top: 16px; font-size: 14px; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    tr:hover { background-color: #f1f1f1; }
  </style>
</head>
<body>
${htmlTable}
</body>
</html>`;
    onProgress?.(100, 'HTML table export complete!');
    return new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  }

  if (tgt === 'TXT') {
    const txtContent = XLSX.utils.sheet_to_txt(worksheet);
    onProgress?.(100, 'Text export complete!');
    return new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
  }

  throw new Error(`Unsupported spreadsheet target format: ${targetFormat}`);
}
