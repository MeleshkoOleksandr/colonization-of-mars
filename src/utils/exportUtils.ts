import { GameResult, Localization } from '../types';

export const exportToCSV = (results: GameResult[], loc: Localization) => {
  // 1. Column headers
  const headers = [
    loc.csv_h_operator || 'Operatore',
    loc.csv_h_team || 'Unità',
    loc.csv_h_score || 'Score',
    loc.csv_h_date || 'Data',
    loc.csv_h_time || 'Ora',
  ];

  // 2. Converting results into text strings
  const rows = results.map(res => [
    `"${res.username}"`, // Quotation are needed so that commas in names don't mess up the table
    `"${res.team_name}"`,
    res.score === -1 ? loc.csv_status_waiting || 'WAIT' : res.score,
    res.created_at ? new Date(res.created_at).toLocaleDateString() : 'N/A',
    res.created_at ? new Date(res.created_at).toLocaleTimeString() : 'N/A',
  ]);

  // 3. Combine everything into one long string
  const csvContent = [
    'sep=;', // tell Excel to use semicolons
    headers.join(';'),
    ...rows.map(e => e.join(';')),
  ].join('\n');

  // 4. Create a file in the browser's memory (Blob)
  // Add a BOM (Byte Order Mark) so that Excel can correctly display special characters
  const blob = new Blob(['\ufeff' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);

  //File name with current data
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0');
  const fileName = `MISSION_REPORT_${dateStr}_${timeStr}.csv`;

  // 5. Click here to download
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadQRCode = (name: string, loc: Localization) => {
  const qrCanvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
  if (!qrCanvas) return;

  // 1. Dimensions
  const qrSize = 1250;
  const padding = 100; // Indents on the sides
  const headerSpace = 250; // Space for text at the top
  // Creating the final canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  // Final Dimensions
  canvas.width = qrSize + padding * 2;
  canvas.height = qrSize + headerSpace + padding;

  // 2. Draw the background (black, like in the game)
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 3. Drawing a Frame (Retro Style)
  ctx.strokeStyle = '#00ff41';
  ctx.lineWidth = 20;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  // 4. Text formatting (large and bold)
  ctx.fillStyle = '#00ff41';
  ctx.font = '900 80px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const titlePart1 = loc.modal_msg_qr;
  const titlePart2 = name.toUpperCase();
  ctx.fillText(titlePart1, canvas.width / 2, 80);

  ctx.fillStyle = '#8cff9e'; // Имя игрока выделим белым
  ctx.font = '900 100px monospace';
  ctx.fillText(titlePart2, canvas.width / 2, 180);

  // 5. Drow the QR code
  ctx.fillStyle = '#00ff41';
  ctx.fillRect(padding - 10, headerSpace - 10, qrSize + 20, qrSize + 20);
  ctx.drawImage(qrCanvas, padding, headerSpace);

  // 6. Saving
  const pngUrl = canvas.toDataURL('image/png');
  const downloadLink = document.createElement('a');
  downloadLink.href = pngUrl;
  downloadLink.download = `QR_ID_${name.replace(/\s+/g, '_').toUpperCase()}.png`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
};
