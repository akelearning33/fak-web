import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export type FakRow = {
  sn: string;
  [k: `item${number}`]: string | null | undefined;
};

const CELL_SN = 'E4';
const RANGE_MED_START = 'E11'; // 14 rows -> E11:E24
const RANGE_EQ_START  = 'E26'; // 18 rows -> E26:E43

function refRange(start: string, rows: number) {
  const col = start.replace(/[0-9]/g, '');
  const r0  = parseInt(start.replace(/\D/g, ''), 10);
  return `${start}:${col}${r0 + rows - 1}`;
}

// function writeColumn(ws: ExcelJS.Worksheet, start: string, values: (string | null | undefined)[]) {
//   const range = refRange(start, values.length);
//   const cells: string[][] = values.map(v => [v ?? '']);
//   ws.getCell(start); // ensure sheet init
//   const [col] = start.replace(/[0-9]/g, '');
//   const r0 = parseInt(start.replace(/\D/g, ''), 10);
//   values.forEach((v, i) => ws.getCell(`${col}${r0 + i}`).value = v ?? '');
// }

export async function exportOneSN(templateUrl: string, rec: FakRow) {
  const wb = new ExcelJS.Workbook();
  const buf = await fetch(templateUrl).then(r => r.arrayBuffer());
  await wb.xlsx.load(buf);

  const ws = wb.worksheets[0];

  ws.getCell(CELL_SN).value = `Serial Number : ${rec.sn}`;

  const meds: string[] = [];
  for (let i = 5; i <= 18; i++) meds.push(String(rec[`item${i}`] ?? ''));
  writeColumn(ws, RANGE_MED_START, meds);

  const eqs: string[] = [];
  for (let i = 19; i <= 36; i++) eqs.push(String(rec[`item${i}`] ?? ''));
  writeColumn(ws, RANGE_EQ_START, eqs);

  const out = await wb.xlsx.writeBuffer();
  saveAs(new Blob([out]), `FAK_${rec.sn}.xlsx`);
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

export async function exportAllSN(templateUrl: string, rows: FakRow[]) {
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

    ws.getCell(CELL_SN).value = `Serial Number : ${rec.sn}`;

    const meds: string[] = []; for (let i = 5; i <= 18; i++) meds.push(String(rec[`item${i}`] ?? ''));
    writeColumn(ws, 'E11', meds);

    const eqs: string[] = [];  for (let i = 19; i <= 36; i++) eqs.push(String(rec[`item${i}`] ?? ''));
    writeColumn(ws, 'E26', eqs);
  }

  wb.removeWorksheet(base.id);

  const out = await wb.xlsx.writeBuffer();
  saveAs(new Blob([out]), `FAK_EXPORT_${new Date().toISOString().slice(0,10)}.xlsx`);
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
