import { useEffect, useMemo, useState } from 'react';
import { Container, TextField, Box, Button, Grid, Typography, Stack, Chip, InputAdornment } from '@mui/material';
import { supabase } from './lib/supabase';
import { MEDICATION, EQUIPMENT } from './items';
import { exportOneSN, exportAllSN } from './exportExcel';
import type { FakRow } from './exportExcel';
import { DataGrid, GridActionsCellItem  } from '@mui/x-data-grid';
import type { GridColDef, GridRowParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { formatDDMMYYYYPartial, isValidDateDDMMYYYY, FULL_DATE_RE, isFutureDateDDMMYYYY } from './utils/dateFormat';


const DATE_RE = /^$|^\d{2}\/\d{2}\/\d{4}$/;
const TEMPLATE_URL = '/report_FAK.xlsx';

type FormState = Record<string, string>; // key: item5..item36

export default function App() {
  const [sn, setSN] = useState('');
  const [form, setForm] = useState<FormState>({});
  const [loading, setLoading] = useState(false);
  const _allItems = useMemo(() => [...MEDICATION, ...EQUIPMENT], []);
  type RowLite = { id: string; sn: string };

const [rows, setRows] = useState<RowLite[]>([]);
const [gridLoading, setGridLoading] = useState(false);
const [confirmOpen, setConfirmOpen] = useState(false);
const [pendingDeleteSN, setPendingDeleteSN] = useState<string | null>(null);

useEffect(() => { fetchRows(); }, []);

const fetchRows = async () => {
  setGridLoading(true);
  const { data, error } = await supabase
    .from('fak_items')
    .select('sn')
    .order('sn', { ascending: true });
  setGridLoading(false);
  if (error) { console.error(error); return; }
  const mapped = (data || []).map((r: any) => ({ id: r.sn, sn: r.sn }));
  setRows(mapped);
};

  // โหลดครั้งแรก และหลังบันทึก/ลบจะเรียก fetchRows อีกที
  async function loadSN(targetSN?: string) {
    const value = (targetSN ?? sn).trim();
    if (!value) { alert('กรุณากรอก SN ก่อนค้นหา'); return; }

    setLoading(true);
    const { data, error } = await supabase
      .from('fak_items')
      .select('*')
      .eq('sn', value)
      .maybeSingle();
    setLoading(false);

    if (error) { alert(error.message); return; }

    // อัปเดตกล่อง SN ให้ตรงกับที่กด และ populate ฟอร์ม
    setSN(value);
    const next: Record<string, string> = {};
    for (let i = 5; i <= 36; i++) next[`item${i}`] = data?.[`item${i}`] || '';
    setForm(next);
  }

  const save = async () => {
    if (!sn.trim()) { alert('กรุณากรอก SN'); return; }
    // validate
    for (let i = 5; i <= 36; i++) {
      const v = form[`item${i}`] ?? '';
      // if (!DATE_RE.test(v)) return alert(`รูปแบบวันที่ไม่ถูกต้องที่ item${i} → ใช้ dd/mm/yyyy หรือเว้นว่าง`);
      if (v !== '' && !isFutureDateDDMMYYYY(v)) {
        return alert(
          `วันที่ item ${i} ต้องมากกว่าวันนี้อย่างน้อย 1 ปี (รูปแบบ dd/mm/yyyy)`
        );
      }
    }

    setLoading(true);
    const payload: any = { sn: sn.trim() };
    for (let i = 5; i <= 36; i++) payload[`item${i}`] = form[`item${i}`] || null;

     const { error } = await supabase.from('fak_items').upsert(payload, { onConflict: 'sn' });
    setLoading(false);
    if (error) return alert(error.message);
    alert('บันทึกสำเร็จ');
    fetchRows(); // 🔁 refresh ตาราง
  };

  const onExportOne = async () => {
    if (!sn.trim()) return alert('กรุณากรอก SN');
    setLoading(true);
    const { data, error } = await supabase.from('fak_items').select('*').eq('sn', sn.trim()).maybeSingle();
    setLoading(false);
    if (error) return alert(error.message);
    if (!data) return alert('ไม่พบ SN นี้');

    const rec: FakRow = { sn: data.sn };
    for (let i = 5; i <= 36; i++) (rec as any)[`item${i}`] = data[`item${i}`] || '';
    await exportOneSN(TEMPLATE_URL, rec);
  };

  const onExportAll = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('fak_items').select('*');
    setLoading(false);
    if (error) return alert(error.message);
    const rows: FakRow[] = (data || []).map((r: any) => {
      const x: FakRow = { sn: r.sn };
      for (let i = 5; i <= 36; i++) (x as any)[`item${i}`] = r[`item${i}`] || '';
      return x;
    });
    if (!rows.length) return alert('ยังไม่มีข้อมูล');
    await exportAllSN(TEMPLATE_URL, rows);
  };

// ใส่ type ให้ columns และ params
const columns: GridColDef<RowLite>[] = [
  { field: 'sn', headerName: 'SN', flex: 1, minWidth: 160 },
  {
    field: 'actions',
    type: 'actions',
    headerName: 'Actions',
    width: 120,
    getActions: (params: GridRowParams<RowLite>) => [
      <GridActionsCellItem
        icon={<EditIcon fontSize="small" />}
        label="Edit"
        onClick={(e) => { e.stopPropagation(); loadSN(params.row.sn); }}
        showInMenu={false}
      />,
      <GridActionsCellItem
        icon={<DeleteIcon fontSize="small" color="error" />}
        label="Delete"
        onClick={() => { setPendingDeleteSN(params.row.sn); setConfirmOpen(true); }}
        showInMenu={false}
      />
    ],
  },
];

const deleteSN = async (snToDelete: string) => {
  const value = snToDelete.trim();
  if (!value) return;

  // optimistic UI: ตัดออกก่อน เพื่อความไว
  setRows(prev => prev.filter(r => r.sn !== value));

  const { error } = await supabase
    .from('fak_items')
    .delete()
    .eq('sn', value);

  if (error) {
    alert('ลบไม่สำเร็จ: ' + error.message);
    // rollback ถ้าล้มเหลว
    await fetchRows();
    return;
  }

  // เคลียร์ฟอร์มถ้ากำลังดู SN เดียวกัน
  if (sn.trim() === value) {
    setSN('');
    const cleared: Record<string, string> = {};
    for (let i = 5; i <= 36; i++) cleared[`item${i}`] = '';
    setForm(cleared);
  }

  setConfirmOpen(false);
  setPendingDeleteSN(null);
};



  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }} >
          <Typography variant="h5" fontWeight={700} gutterBottom>Drug Box Report (FAK)</Typography>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }} >
          {/* โชว์เฉพาะตอนมี SN ที่กำลังแก้/ดูอยู่ */}
          {sn?.trim() && (
            <Chip
              label={`SN: ${sn.trim()}`}
              color="secondary"
              variant="filled"     // เปลี่ยนเป็น "filled" ได้ถ้าชอบ
              sx={{ fontWeight: 600 }}
            />
          )}
        </Grid>
      </Grid>            
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }} >
          <Box sx={{ p:2, border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 2, bgcolor: 'background.paper' }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                label="SN"
                value={sn}
                onChange={e => setSN(e.target.value)}
                size="small"
                sx={{ width: 250 }}
                onKeyDown={(e) => { if (e.key === 'Enter') loadSN(sn); }}
              />
              <Button variant="outlined" onClick={() => loadSN(sn)} disabled={loading}>
                ค้นหา SN
              </Button>
              <Button variant="contained" onClick={save} disabled={loading}>บันทึก</Button>
              
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              รูปแบบวันหมดอายุ: <b>dd/mm/yyyy</b> (เว้นว่างได้) • รายการ 1-4 เป็นเอกสาร ไม่ต้องกรอก
            </Typography>
          </Box>      
          <Box sx={{p: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Stack direction="row-reverse" spacing={2} alignItems="center">
              {/* <Button variant="outlined" onClick={onExportOne} disabled={loading}>Export SN นี้</Button> */}
              <Button variant="contained" color="success" onClick={onExportAll} disabled={loading}>Export Excel</Button>
            </Stack>
            <Typography fontWeight={700} sx={{ mb: 1 }}>รายการ SN</Typography>
            <div style={{ height: 420, width: '100%' }}>
              <DataGrid
                rows={rows}
                columns={columns}
                loading={gridLoading}
                disableRowSelectionOnClick
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10, page: 0 } },
                }}
              />
            </div>
          </Box>    
        </Grid>
        <Grid size={{ xs: 12, md: 4 }} >
            {/* input data  */}
            <Box sx={{ p:2, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' }}>
              <Typography fontWeight={700} sx={{ mb: 0.5 }}>MEDICATION (5-18)</Typography>
              <Typography variant='subtitle2' sx={{ mb: 2 }}>พิมพ์ตัวเลขติดกันได้ ระบบจะใส่ / ให้อัตโนมัติ (เช่น 25122025 → 25/12/2025)</Typography>
              <Grid container spacing={2}>
                {/* 🔹 MEDICATION */}
                {MEDICATION.map((it) => {
                  const value = form[`item${it.item}`] || "";
                  const valid = value !== "" && isFutureDateDDMMYYYY(value);

                  return (
                    <Grid size={{ xs: 12, md: 12 }} key={it.item}>
                      <TextField
                        fullWidth
                        size="small"
                        label={`[${it.item}] ${it.label}`}
                        placeholder="dd/mm/yyyy"
                        value={value}
                        onChange={(e) => {
                          const v = e.target.value ?? "";
                          const formatted = formatDDMMYYYYPartial(v);
                          setForm((s) => ({ ...s, [`item${it.item}`]: formatted }));
                        }}

                        /* ✅ native attributes ใส่ที่ inputProps */
                        inputProps={{
                          inputMode: "numeric",
                          pattern: "\\d{2}/\\d{2}/\\d{4}",
                        }}

                        /* ✅ ส่วนตกแต่ง/ไอคอน ใส่ที่ InputProps */
                        InputProps={{
                          endAdornment: valid ? (
                            <InputAdornment position="end">
                              <CheckCircleIcon sx={{ color: "success.main" }} />
                            </InputAdornment>
                          ) : undefined,
                        }}

                        error={value !== "" && !isFutureDateDDMMYYYY(value)}
                        helperText={
                          value === ""
                            ? ""
                            : isFutureDateDDMMYYYY(value)
                            ? "รูปแบบถูกต้อง"
                            : "รูปแบบหรือค่าวัน/เดือนไม่ถูกต้อง"
                        }
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": { borderColor: valid ? "success.main" : undefined },
                            "&:hover fieldset": { borderColor: valid ? "success.dark" : undefined },
                            "&.Mui-focused fieldset": { borderColor: valid ? "success.dark" : undefined },
                          },
                        }}
                      />

                    </Grid>
                  );
                })}
              </Grid>                           
            </Box>

        </Grid>
        <Grid size={{ xs: 12, md: 4 }} >
            <Box sx={{ p:2, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' }}>
                <Typography fontWeight={700} sx={{ mb: 0.5 }}>EQUIPMENT (19-36)</Typography>
                <Typography variant='subtitle2' sx={{ mb: 2 }}>พิมพ์ตัวเลขติดกันได้ ระบบจะใส่ / ให้อัตโนมัติ (เช่น 25122025 → 25/12/2025)</Typography>
                <Grid container spacing={2}>
                  {/* 🔹 EQUIPMENT */}
                  {EQUIPMENT.map((it) => {
                    const value = form[`item${it.item}`] || "";
                    const valid = value !== "" && isFutureDateDDMMYYYY(value);

                    return (
                      <Grid size={{ xs: 12, md: 12 }} key={it.item}>
                        <TextField
                        fullWidth
                        size="small"
                        label={`[${it.item}] ${it.label}`}
                        placeholder="dd/mm/yyyy"
                        value={value}
                        onChange={(e) => {
                          const v = e.target.value ?? "";
                          const formatted = formatDDMMYYYYPartial(v);
                          setForm((s) => ({ ...s, [`item${it.item}`]: formatted }));
                        }}

                        /* ✅ native attributes ใส่ที่ inputProps */
                        inputProps={{
                          inputMode: "numeric",
                          pattern: "\\d{2}/\\d{2}/\\d{4}",
                        }}

                        /* ✅ ส่วนตกแต่ง/ไอคอน ใส่ที่ InputProps */
                        InputProps={{
                          endAdornment: valid ? (
                            <InputAdornment position="end">
                              <CheckCircleIcon sx={{ color: "success.main" }} />
                            </InputAdornment>
                          ) : undefined,
                        }}

                        error={value !== "" && !isFutureDateDDMMYYYY(value)}
                        helperText={
                          value === ""
                            ? ""
                            : isFutureDateDDMMYYYY(value)
                            ? "รูปแบบถูกต้อง"
                            : "รูปแบบหรือค่าวัน/เดือนไม่ถูกต้อง"
                        }
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": { borderColor: valid ? "success.main" : undefined },
                            "&:hover fieldset": { borderColor: valid ? "success.dark" : undefined },
                            "&.Mui-focused fieldset": { borderColor: valid ? "success.dark" : undefined },
                          },
                        }}
                      />
                      </Grid>
                    );
                  })}
                </Grid>
            </Box>    
        </Grid>
      </Grid>            

      

      {/* Confirm dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>ลบข้อมูล</DialogTitle>
        <DialogContent>
          <Typography>ยืนยันลบ SN: <b>{pendingDeleteSN}</b> ?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>ยกเลิก</Button>
          <Button
            color="error"
            onClick={async () => {
              if (pendingDeleteSN) {
                await deleteSN(pendingDeleteSN);
              }
            }}
          >
            ลบ
          </Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
}
