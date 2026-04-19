import { Box } from '@mui/material';

type GameEmbedPageProps = {
  title: string;
  gameUrl: string;
};

function GameEmbedPage({ title, gameUrl }: GameEmbedPageProps) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f7f9fc' }}>
      <Box
        component="iframe"
        src={gameUrl}
        title={title}
        sx={{
          display: 'block',
          width: '100%',
          height: '100vh',
          border: 0,
          bgcolor: '#fff',
        }}
      />
    </Box>
  );
}

export default GameEmbedPage;
