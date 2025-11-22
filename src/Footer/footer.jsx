import { Box, Container, Typography, Divider } from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import GitHubIcon from '@mui/icons-material/GitHub';

function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        mt: 0,
        py: 3,
        px: 2,
        background: 'linear-gradient(180deg, transparent 0%, rgba(20, 20, 30, 0.6) 50%, rgba(10, 10, 20, 0.9) 100%)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(145, 70, 255, 0.1)',
      }}
    >
      <Container maxWidth="lg">
        <Divider sx={{ borderColor: 'rgba(145, 70, 255, 0.1)', mb: 3 }} />

        {/* Footer Info */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'center', sm: 'center' },
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CodeIcon sx={{ color: '#9146FF', fontSize: '1.2rem' }} />
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: { xs: '0.8rem', sm: '0.85rem' },
              }}
            >
              Built with React, Vite & Material-UI
            </Typography>
          </Box>

          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: { xs: '0.8rem', sm: '0.85rem' },
            }}
          >
            © {new Date().getFullYear()} Lume • Educational Portfolio Project
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: { xs: '0.75rem', sm: '0.8rem' },
            }}
          >
            Data provided by{' '}
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#9146FF',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              TMDB
            </a>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

export default Footer;
