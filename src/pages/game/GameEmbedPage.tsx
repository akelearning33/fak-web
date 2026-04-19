import { Box, Button, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

type GameEmbedPageProps = {
  title: string;
  gameUrl: string;
};

function GameEmbedPage({ title, gameUrl }: GameEmbedPageProps) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f7f9fc' }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          px: { xs: 2, sm: 3 },
          py: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Child-friendly game page
          </Typography>
        </Box>

        <Button component={Link} to="/" variant="contained">
          Back Home
        </Button>
      </Stack>

      <Box
        component="iframe"
        src={gameUrl}
        title={title}
        sx={{
          display: 'block',
          width: '100%',
          height: 'calc(100vh - 88px)',
          border: 0,
          bgcolor: '#fff',
        }}
      />
    </Box>
  );
}

export default GameEmbedPage;
