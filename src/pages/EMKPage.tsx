import { useEffect, useMemo, useState } from 'react';
import { Container, TextField, Box, Button, Grid, Typography, Stack, Chip, InputAdornment } from '@mui/material';
import { supabase } from '../lib/supabase';
import { EMK_EQUIPMENT, EMK_INJECTION, EMK_ORAL, EMK_SPRAY, EMK_OINTMENT } from '../items';
import { exportOneSN, exportAllSN } from '../exportExcel_EMK';
import type { EmkRow } from '../exportExcel_EMK';
import { DataGrid, GridActionsCellItem  } from '@mui/x-data-grid';
import type { GridColDef, GridRowParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { formatDDMMYYYYPartial, isFutureDateDDMMYYYY } from '../utils/dateFormat';

const TEMPLATE_URL = '/report_EMK.xlsx';

type FormState = Record<string, string>; // key: item1..item51

export default function EMKPage() {
  const [sn, setSN] = useState('');
  const [form, setForm] = useState<FormState>({});
  const [loading, setLoading] = useState(false);
  
  const _allItems = useMemo(() => [
    ...EMK_EQUIPMENT,
    ...EMK_INJECTION,
    ...EMK_ORAL,
    ...EMK_SPRAY,
    ...EMK_OINTMENT
  ], []);

  type RowLite = { id: string; sn: string };

  const [rows, setRows] = useState<RowLite[]>([]);
  const [gridLoading, setGridLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteSN, setPendingDeleteSN] = useState<string | null>(null);

  useEffect(() => { fetchRows(); }, []);

  const fetchRows = async () => {
    setGridLoading(true);
    const { data, error } = await supabase
      .from('emk_items')
      .select('sn')
      .order('sn', { ascending: true });
    setGridLoading(false);
    if (error) { console.error(error); return; }
    const mapped = (data || []).map((r: any) => ({ id: r.sn, sn: r.sn }));
    setRows(mapped);
  };

  async function loadSN(targetSN?: string) {
    const value = (targetSN ?? sn).trim();
    if (!value) { alert('กรุณากรอก SN ก่อนค้นหา'); return; }

    setLoading(true);
    const { data, error } = await supabase
      .from('emk_items')
      .select('*')
      .eq('sn', value)
      .maybeSingle();
    setLoading(false);

    if (error) { alert(error.message); return; }

    setSN(value);
    const next: Record<string, string> = {};
    // Items 1-51
    for (let i = 1; i <= 51; i++) next[`item${i}`] = data?.[`item${i}`] || '';
    setForm(next);
  }

  const save = async () => {
    if (!sn.trim()) { alert('กรุณากรอก SN'); return; }
    // validate
    for (let i = 1; i <= 51; i++) {
      const v = form[`item${i}`] ?? '';
      if (v !== '' && !isFutureDateDDMMYYYY(v)) {
        return alert(
          `วันที่ item ${i} ต้องมากกว่าวันนี้อย่างน้อย 1 ปี (รูปแบบ dd/mm/yyyy)`
        );
      }
    }

    setLoading(true);
    const payload: any = { sn: sn.trim() };
    for (let i = 1; i <= 51; i++) payload[`item${i}`] = form[`item${i}`] || null;

     const { error } = await supabase.from('emk_items').upsert(payload, { onConflict: 'sn' });
    setLoading(false);
    if (error) return alert(error.message);
    alert('บันทึกสำเร็จ');
    fetchRows();
  };

  const onExportOne = async () => {
    if (!sn.trim()) return alert('กรุณากรอก SN');
    setLoading(true);
    const { data, error } = await supabase.from('emk_items').select('*').eq('sn', sn.trim()).maybeSingle();
    setLoading(false);
    if (error) return alert(error.message);
    if (!data) return alert('ไม่พบ SN นี้');

    const rec: EmkRow = { sn: data.sn };
    for (let i = 1; i <= 51; i++) (rec as any)[`item${i}`] = data[`item${i}`] || '';
    await exportOneSN(TEMPLATE_URL, rec);
  };

  const onExportAll = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('emk_items').select('*');
    setLoading(false);
    if (error) return alert(error.message);
    const rows: EmkRow[] = (data || []).map((r: any) => {
      const x: EmkRow = { sn: r.sn };
      for (let i = 1; i <= 51; i++) (x as any)[`item${i}`] = r[`item${i}`] || '';
      return x;
    });
    if (!rows.length) return alert('ยังไม่มีข้อมูล');
    await exportAllSN(TEMPLATE_URL, rows);
  };

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

    setRows(prev => prev.filter(r => r.sn !== value));

    const { error } = await supabase
      .from('emk_items')
      .delete()
      .eq('sn', value);

    if (error) {
      alert('ลบไม่สำเร็จ: ' + error.message);
      await fetchRows();
      return;
    }

    if (sn.trim() === value) {
      setSN('');
      const cleared: Record<string, string> = {};
      for (let i = 1; i <= 51; i++) cleared[`item${i}`] = '';
      setForm(cleared);
    }

    setConfirmOpen(false);
    setPendingDeleteSN(null);
  };

  const renderInputGroup = (title: string, items: typeof EMK_EQUIPMENT) => (
    <Box sx={{ p:2, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper', mb: 2 }}>
      <Typography fontWeight={700} sx={{ mb: 0.5 }}>{title}</Typography>
      <Grid container spacing={2}>
        {items.map((it) => {
          const value = form[`item${it.item}`] || "";
          const valid = value !== "" && isFutureDateDDMMYYYY(value);

          return (
            <Grid size={{ xs: 12 }} key={it.item}>
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
                inputProps={{
                  inputMode: "numeric",
                  pattern: "\\d{2}/\\d{2}/\\d{4}",
                }}
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
  );

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="h5" fontWeight={700} gutterBottom>Emergency Kit Report (EMK)</Typography>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          {sn?.trim() && (
            <Chip
              label={`SN: ${sn.trim()}`}
              color="secondary"
              variant="filled"
              sx={{ fontWeight: 600 }}
            />
          )}
        </Grid>
      </Grid>            
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
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
              รูปแบบวันหมดอายุ: <b>dd/mm/yyyy</b> (เว้นว่างได้)
            </Typography>
          </Box>      
          <Box sx={{p: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Stack direction="row-reverse" spacing={2} alignItems="center">
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
        
        <Grid size={{ xs: 12, md: 4 }}>
          {renderInputGroup("EQUIPMENT (5-30)", EMK_EQUIPMENT)}
          {renderInputGroup("INJECTION (31-47)", EMK_INJECTION)}
        </Grid>
        
        <Grid size={{ xs: 12, md: 4 }}>
          {renderInputGroup("ORAL (48-53)", EMK_ORAL)}
          {renderInputGroup("SPRAY (54)", EMK_SPRAY)}
          {renderInputGroup("OINTMENT (55)", EMK_OINTMENT)}
        </Grid>
      </Grid>            

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