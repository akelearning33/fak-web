import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { AppBar, Toolbar, Button, Container, Box, CssBaseline, Typography } from '@mui/material';

// Assuming these components exist
import FAKPage from './pages/FAKPage';
import EMKPage from './pages/EMKPage';

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
            <Button color="secondary" variant="contained" component={Link} to="/fak" sx={{ mr: 2 }}>
              FAK Page
            </Button>
            <Button color="secondary" variant="contained" component={Link} to="/emk">
              EMK Page
            </Button>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ mt: 4 }}>
          {/* Route Definitions */}
          <Routes>
            <Route path="/fak" element={<FAKPage />} />
            <Route path="/emk" element={<EMKPage />} />
            
            {/* Fallback/Default Route */}
            <Route path="*" element={
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Typography variant="h5">Select a page from the menu above.</Typography>
              </Box>
            } />
          </Routes>
        </Container>
      </Box>
    </Router>
  );
}

export default App;