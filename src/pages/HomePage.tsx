import { useEffect, useState } from 'react';
import { Container, Typography, Button, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { supabase } from '../lib/supabase';
import { formatDDMMYYYY } from '../utils/dateFormat';

interface DailyReport {
  report_date: string;
  created_at: string;
}

export default function HomePage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('daily_reports')
      .select('*')
      .order('report_date', { ascending: false });
    
    setLoading(false);
    if (error) {
      console.error('Error fetching reports:', error);
      return;
    }
    setReports(data || []);
  };

  const handleCreateReport = async () => {
    if (!selectedDate) return;

    setLoading(true);
    // Check if exists or insert
    const { error } = await supabase
      .from('daily_reports')
      .upsert({ report_date: selectedDate }, { onConflict: 'report_date' });

    setLoading(false);
    
    if (error) {
      alert('Error creating report: ' + error.message);
      return;
    }

    setOpenDialog(false);
    navigate(`/report/${selectedDate}`);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Daily Reports
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => setOpenDialog(true)}
        >
          บันทึก Report ใหม่
        </Button>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell><Typography fontWeight="bold">วันที่ทำรายการ</Typography></TableCell>
              <TableCell align="right"><Typography fontWeight="bold">จัดการ</Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  ยังไม่มีรายการบันทึก
                </TableCell>
              </TableRow>
            ) : (
              reports.map((row) => (
                <TableRow key={row.report_date} hover>
                  <TableCell>
                    {formatDDMMYYYY(row.report_date)}
                  </TableCell>
                  <TableCell align="right">
                    <Button 
                      variant="outlined" 
                      size="small" 
                      startIcon={<EditIcon />}
                      onClick={() => navigate(`/report/${row.report_date}`)}
                    >
                      แก้ไข
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>เลือกวันที่ทำรายการ</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              type="date"
              fullWidth
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>ยกเลิก</Button>
          <Button 
            variant="contained" 
            onClick={handleCreateReport}
            disabled={!selectedDate || loading}
          >
            ยืนยัน
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
