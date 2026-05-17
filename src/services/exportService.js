import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

function csvPathForSource(source) {
  const root = process.cwd();
  if (source === 'data1') return path.join(root, 'data', 'data1', 'Reporte_Delito_Violencia_Intrafamiliar_Polic_a_Nacional.csv');
  if (source === 'processed') return path.join(root, 'data', 'processed', 'train.csv');
  // default to data2
  return path.join(root, 'data', 'data2', 'Domestic violence.csv');
}

function streamCsvBackup(res, source = 'data2') {
  const csvPath = csvPathForSource(source);

  if (!fs.existsSync(csvPath)) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Source CSV not found', path: csvPath }));
    return;
  }

  const filename = `quietink-backup-${source}.pdf`;
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/pdf');

  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  doc.pipe(res);

  doc.fontSize(16).text('QuietInk Backup', { align: 'center' });
  doc.moveDown();
  doc.fontSize(10);

  const stream = fs.createReadStream(csvPath, { encoding: 'utf8' });
  let leftover = '';
  let rowCount = 0;

  stream.on('data', (chunk) => {
    const data = leftover + chunk;
    const lines = data.split(/\r?\n/);
    leftover = lines.pop();
    for (const line of lines) {
      rowCount++;
      // Simple text output; wrap long lines
      doc.text(`${rowCount}. ${line}`);
      if (doc.y > 720) {
        doc.addPage();
      }
    }
  });

  stream.on('end', () => {
    if (leftover && leftover.trim().length > 0) {
      rowCount++;
      doc.text(`${rowCount}. ${leftover}`);
    }
    doc.end();
  });

  stream.on('error', (err) => {
    console.error('CSV read error:', err);
    try {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Failed to stream CSV for PDF' }));
    } catch (e) {}
  });
}

export { streamCsvBackup };
