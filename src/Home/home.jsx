import Banner from "../Common-ui/banner";
import Cards from "../Common-ui/cards";
import { Box, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

function Home() {
    return (
        <>
          {/* Educational Disclaimer */}
          <Box
            sx={{
              mx: 2,
              mt: 2,
              mb: 3,
              p: 2,
              borderRadius: 1.5,
              background: 'rgba(145, 70, 255, 0.05)',
              border: '1px solid rgba(145, 70, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <InfoOutlinedIcon sx={{ color: '#9146FF', fontSize: '1.2rem', flexShrink: 0 }} />
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: { xs: '0.8rem', sm: '0.85rem' },
                lineHeight: 1.5,
              }}
            >
              <strong style={{ color: '#9146FF' }}>Educational Project:</strong> This portfolio website does not host or support pirated content. All data is from TMDB API and Cinemos.live for demonstration purposes only.
            </Typography>
          </Box>

          <Banner category="trending-in-india" />
          <Cards />
        </>
    );
}

export default Home;

