import { BrowserRouter as Router, Route, Routes, Link, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Button, Container, Box, CssBaseline, Typography } from '@mui/material';

import FAKPage from './pages/FAKPage';
import EMKPage from './pages/EMKPage';
import HomePage from './pages/HomePage';
import ReportPage from './pages/ReportPage';
import GameEmbedPage from './pages/game/GameEmbedPage';

const game1Url = new URL('./pages/game/game1.html', import.meta.url).href;
const game2Url = new URL('./pages/game/game2.html', import.meta.url).href;

function AppShell() {
  const location = useLocation();
  const isGameRoute = location.pathname.startsWith('/game/');

  return (
    <>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        {!isGameRoute && (
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1, mr: 2 }}>
                Web report FAK / EMK
              </Typography>
              <Button color="inherit" component={Link} to="/" sx={{ mr: 2 }}>
                Home
              </Button>
            </Toolbar>
          </AppBar>
        )}

        <Container
          maxWidth={isGameRoute ? false : 'xl'}
          disableGutters={isGameRoute}
          sx={{ mt: isGameRoute ? 0 : 4 }}
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/report/:date" element={<ReportPage />} />
            <Route path="/fak" element={<FAKPage />} />
            <Route path="/emk" element={<EMKPage />} />
            <Route path="/game/1" element={<GameEmbedPage title="Game 1" gameUrl={game1Url} />} />
            <Route path="/game/2" element={<GameEmbedPage title="Game 2" gameUrl={game2Url} />} />
            <Route
              path="*"
              element={
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                  <Typography variant="h5">Page not found</Typography>
                  <Button component={Link} to="/" sx={{ mt: 2 }}>
                    Go Home
                  </Button>
                </Box>
              }
            />
          </Routes>
        </Container>
      </Box>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

export default App;
