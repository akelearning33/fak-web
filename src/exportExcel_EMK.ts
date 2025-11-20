import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export type EmkRow = {
  sn: string;
  [k: `item${number}`]: string | null | undefined;
};

const CELL_SN = 'A2'; // P/N 453-004 SN: {sn}

// Ranges
const RANGE_EQUIPMENT_START = 'E9';  // 26 items (1-26) -> E9:E34
const RANGE_INJECTION_START = 'E36'; // 17 items (27-43) -> E36:E52
const RANGE_ORAL_START = 'E54'; // 6 items (44-49) -> E54:E59
const RANGE_SPRAY_START = 'E61'; // 1 item (50) -> E61
const RANGE_OINTMENT_START = 'E63'; // 1 item (51) -> E63

export async function exportOneSN(templateUrl: string, rec: EmkRow) {
  const wb = new ExcelJS.Workbook();
  const buf = await fetch(templateUrl).then(r => r.arrayBuffer());
  await wb.xlsx.load(buf);

  const ws = wb.worksheets[0];

  ws.getCell(CELL_SN).value = `P/N 453-004 SN: ${rec.sn}`;

  // Equipment (1-26)
  const equipment: string[] = [];
  for (let i = 1; i <= 26; i++) equipment.push(String(rec[`item${i}`] ?? ''));
  writeColumn(ws, RANGE_EQUIPMENT_START, equipment);

  // Injection (27-43)
  const injection: string[] = [];
  for (let i = 27; i <= 43; i++) injection.push(String(rec[`item${i}`] ?? ''));
  writeColumn(ws, RANGE_INJECTION_START, injection);

  // Oral (44-49)
  const oral: string[] = [];
  for (let i = 44; i <= 49; i++) oral.push(String(rec[`item${i}`] ?? ''));
  writeColumn(ws, RANGE_ORAL_START, oral);

  // Spray (50)
  const spray: string[] = [];
  spray.push(String(rec[`item50`] ?? ''));
  writeColumn(ws, RANGE_SPRAY_START, spray);

  // Ointment (51)
  const ointment: string[] = [];
  ointment.push(String(rec[`item51`] ?? ''));
  writeColumn(ws, RANGE_OINTMENT_START, ointment);

  const out = await wb.xlsx.writeBuffer();
  saveAs(new Blob([out]), `EMK_${rec.sn}.xlsx`);
}

// --- helpers ---
function cloneSheetStructure(src: ExcelJS.Worksheet, dst: ExcelJS.Worksheet) {
  // properties / views / page setup (บางอันไม่มีใน type → cast any)
  (dst as any).properties = { ...(src as any).properties };
  (dst as any).views = (src as any).views;
  (dst as any).pageSetup = { ...(src as any).pageSetup };

  // 1) คัดลอกความกว้างคอลัมน์ + style ระดับคอลัมน์ (ถ้ามี)
  src.columns?.forEach((col, i) => {
    const dcol = dst.getColumn(i + 1);
    if (col.width) dcol.width = col.width;

    if ((col as any).style) (dcol as any).style = { ...(col as any).style };
  });

  // 2) คัดลอกความสูงแถว + ค่าต้นฉบับ + สไตล์ระดับเซลล์
  src.eachRow({ includeEmpty: true }, (row, r) => {
    const drow = dst.getRow(r);
    if (row.height) drow.height = row.height;

    row.eachCell({ includeEmpty: true }, (cell, c) => {
      const dcell = drow.getCell(c);
      // ค่าตาม template (เช่นหัวตาราง)
      dcell.value = cell.value as any;

      // คัดลอกสไตล์หลัก ๆ ระดับเซลล์
      dcell.font = cell.font ?? undefined;
      dcell.alignment = cell.alignment ?? undefined;
      dcell.border = cell.border ?? undefined;
      dcell.fill = cell.fill ?? undefined;
      dcell.numFmt = cell.numFmt ?? undefined;
      // บางเวอร์ชันมี cell.protection
      // @ts-ignore
      dcell.protection = (cell as any).protection ?? undefined;
    });
  });

  // 3) คัดลอก merged cells จาก model (API ภายใน)
  const merges: string[] | undefined = (src as any).model?.merges;
  if (Array.isArray(merges)) {
    for (const addr of merges) dst.mergeCells(addr);
  }
}

function cloneImages(src: ExcelJS.Worksheet, dst: ExcelJS.Worksheet) {
  // exceljs: getImages() => [{ imageId: number, range: { tl/br | range } }]
  const getImages = (src as any).getImages?.bind(src);
  const imgs: Array<{ imageId: number; range: any }> = getImages ? getImages() : [];

  for (const img of imgs) {
    // ใช้ imageId เดิม เพราะยังอยู่ใน workbook เดียวกัน
    (dst as any).addImage(img.imageId, img.range);
  }
}

export async function exportAllSN(templateUrl: string, rows: EmkRow[]) {
  const wb = new ExcelJS.Workbook();
  const buf = await fetch(templateUrl).then(r => r.arrayBuffer());
  await wb.xlsx.load(buf);

  const base = wb.worksheets[0];
  base.name = '_BASE';

  for (const rec of rows) {
    if (!rec.sn) continue;

    const ws = wb.addWorksheet(safeTab(rec.sn));
    cloneSheetStructure(base, ws);   // คัดลอกคอลัมน์/แถว/สไตล์/merge
    cloneImages(base, ws);           // ✅ คัดลอกรูปจากแม่แบบมาด้วย

    ws.getCell(CELL_SN).value = `P/N 453-004 SN: ${rec.sn}`;

    // Equipment (1-26)
    const equipment: string[] = [];
    for (let i = 1; i <= 26; i++) equipment.push(String(rec[`item${i}`] ?? ''));
    writeColumn(ws, RANGE_EQUIPMENT_START, equipment);

    // Injection (27-43)
    const injection: string[] = [];
    for (let i = 27; i <= 43; i++) injection.push(String(rec[`item${i}`] ?? ''));
    writeColumn(ws, RANGE_INJECTION_START, injection);

    // Oral (44-49)
    const oral: string[] = [];
    for (let i = 44; i <= 49; i++) oral.push(String(rec[`item${i}`] ?? ''));
    writeColumn(ws, RANGE_ORAL_START, oral);

    // Spray (50)
    const spray: string[] = [];
    spray.push(String(rec[`item50`] ?? ''));
    writeColumn(ws, RANGE_SPRAY_START, spray);

    // Ointment (51)
    const ointment: string[] = [];
    ointment.push(String(rec[`item51`] ?? ''));
    writeColumn(ws, RANGE_OINTMENT_START, ointment);
  }

  wb.removeWorksheet(base.id);

  const out = await wb.xlsx.writeBuffer();
  saveAs(new Blob([out]), `EMK_EXPORT_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// column/row writer เดิมใช้ต่อได้
function writeColumn(ws: ExcelJS.Worksheet, start: string, values: (string | null | undefined)[]) {
  const col = start.replace(/[0-9]/g, '');
  const r0 = parseInt(start.replace(/\D/g, ''), 10);
  values.forEach((v, i) => ws.getCell(`${col}${r0 + i}`).value = v ?? '');
}

function safeTab(s: string) {
  return s.replace(/[\\/?*\[\]:]/g, ' ').slice(0, 31) || 'SN';
}
