import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Tabs, Tab, Button, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FAKPage from './FAKPage';
import EMKPage from './EMKPage';
import { formatDDMMYYYY } from '../utils/dateFormat';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function ReportPage() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (!date) return null;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/')}
          variant="outlined"
        >
          กลับหน้าหลัก
        </Button>
        <Typography variant="h5" fontWeight="bold">
          Report for: {formatDDMMYYYY(date)}
        </Typography>
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="report tabs">
            <Tab label="Drug Box Report (FAK)" />
            <Tab label="Emergency Kit Report (EMK)" />
          </Tabs>
        </Box>
        <CustomTabPanel value={tabValue} index={0}>
          <FAKPage reportDate={date} />
        </CustomTabPanel>
        <CustomTabPanel value={tabValue} index={1}>
          <EMKPage reportDate={date} />
        </CustomTabPanel>
      </Paper>
    </Container>
  );
}
