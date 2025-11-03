// รับสตริงอะไรก็ได้ -> คืนค่าสตริง dd/MM/yyyy แบบพิมพ์ทีละตัว
export function formatDDMMYYYYPartial(input: string) {
  // เก็บเฉพาะตัวเลข และตัดความยาวไม่เกิน 8 หลัก (ddmmyyyy)
  const digits = (input || '').replace(/\D/g, '').slice(0, 8);

  // จัดวาง dd/MM/yyyy แบบเติม / อัตโนมัติเมื่อถึงตำแหน่ง
  let out = '';
  if (digits.length <= 2) out = digits;                           // d | dd
  else if (digits.length <= 4) out = `${digits.slice(0,2)}/${digits.slice(2)}`;           // dd/m | dd/mm
  else out = `${digits.slice(0,2)}/${digits.slice(2,4)}/${digits.slice(4)}`;              // dd/mm/y | dd/mm/yy..yyyy

  return out;
}

// ตรวจว่าเป็น dd/MM/yyyy ครบ 10 ตัวอักษร (เลขล้วนตามฟอร์แมต)
export const FULL_DATE_RE = /^\d{2}\/\d{2}\/\d{4}$/;

export function isValidDateDDMMYYYY(s: string) {
  if (!FULL_DATE_RE.test(s)) return false;
  const [dd, mm, yyyy] = s.split("/").map(Number);
  if (yyyy < 1900 || yyyy > 2099) return false;
  if (mm < 1 || mm > 12) return false;
  const last = new Date(yyyy, mm, 0).getDate();
  if (dd < 1 || dd > last) return false;
  const d = new Date(yyyy, mm - 1, dd);
  return d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd;
}

// parse เป็น Date (local) หรือคืน null ถ้าผิดฟอร์แมต/ไม่ใช่วันจริง
export function parseDDMMYYYY(s: string): Date | null {
  if (!isValidDateDDMMYYYY(s)) return null;
  const [dd, mm, yyyy] = s.split("/").map(Number);
  return new Date(yyyy, mm - 1, dd);
}

// ต้อง “อนาคตเท่านั้น” (strictly > วันนี้)
export function isFutureDateDDMMYYYY(s: string): boolean {
//   const d = parseDDMMYYYY(s);
//   if (!d) return false;
//   const today = new Date();
//   // เปรียบเทียบแบบ day-level: สิ้นสุดของวันนี้ยังไม่นับว่าอนาคต
//   const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
//   return d.getTime() > endOfToday.getTime();

  const d = parseDDMMYYYY(s);
  if (!d) return false;

  const today = new Date();
  // วันที่ขั้นต่ำ = วันนี้ + 1 ปี (ไม่ต้องสนใจเวลา)
  const min = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
  return d.getTime() >= min.getTime();
}
