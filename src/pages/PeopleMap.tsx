import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, CircularProgress, Alert } from '@mui/material';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import MapView from '../components/MapView';

const PeopleMap: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase.from('profiles')
        .select('*').not('lat', 'is', null).not('lng', 'is', null);
      setLoading(false);
      if (error) { setError(error.message); return; }
      setProfiles((data as any) || []);
    };
    fetch();
  }, []);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>People Map</Typography>
        <Typography variant="body1" color="text.secondary">
          See where everyone is located around the world.
        </Typography>
      </Box>
      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}
      {error && <Alert severity="error">{error}</Alert>}
      {!loading && (
        <>
          <MapView profiles={profiles} height="650px" />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {profiles.length} people with location pins.
          </Typography>
        </>
      )}
    </Container>
  );
};

export default PeopleMap;