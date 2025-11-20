import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { AppBar, Toolbar, Button, Container, Box, CssBaseline, Typography } from '@mui/material';

// Components
import FAKPage from './pages/FAKPage';
import EMKPage from './pages/EMKPage';
import HomePage from './pages/HomePage';
import ReportPage from './pages/ReportPage';

function App() {
  return (
    <Router>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        {/* Persistent Navigation Bar */}
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, mr: 2 }}>
              เว็บสำหรับกรอกข้อมูล report FAK และ EMK
            </Typography>
            <Button color="inherit" component={Link} to="/" sx={{ mr: 2 }}>
              Home
            </Button>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ mt: 4 }}>
          {/* Route Definitions */}
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/report/:date" element={<ReportPage />} />
            
            {/* Legacy routes if needed, or redirect */}
            <Route path="/fak" element={<FAKPage />} />
            <Route path="/emk" element={<EMKPage />} />
            
            {/* Fallback/Default Route */}
            <Route path="*" element={
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Typography variant="h5">Page not found</Typography>
                <Button component={Link} to="/" sx={{ mt: 2 }}>Go Home</Button>
              </Box>
            } />
          </Routes>
        </Container>
      </Box>
    </Router>
  );
}

export default App;