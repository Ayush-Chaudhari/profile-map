import React, { useEffect, useState } from 'react';
import {
  Container, Grid, Typography, TextField, Box,
  InputAdornment, CircularProgress, Alert, Chip, Avatar, Card, CardContent, Button
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

const Home: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filtered, setFiltered] = useState<Profile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => { fetchProfiles(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(profiles.filter(p =>
      (p.full_name?.toLowerCase().includes(q)) ||
      (p.username?.toLowerCase().includes(q)) ||
      (p.location?.toLowerCase().includes(q)) ||
      (p.skills?.some(s => s.toLowerCase().includes(q)))
    ));
  }, [search, profiles]);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('profiles')
      .select('*').not('username', 'is', null).order('created_at', { ascending: false });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setProfiles(data || []);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>Discover People</Typography>
        <Typography variant="body1" color="text.secondary">
          Find and connect with people in your community.
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth placeholder="Search by name, username, location or skill..."
          value={search} onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> }}
          sx={{ maxWidth: 600 }}
        />
        {search && (
          <Chip label={`${filtered.length} result${filtered.length !== 1 ? 's' : ''}`}
            size="small" sx={{ ml: 1 }} color="primary" variant="outlined" />
        )}
      </Box>

      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>}
      {error && <Alert severity="error">{error}</Alert>}
      {!loading && filtered.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            {search ? 'No people match your search.' : 'No profiles yet. Be the first to sign up!'}
          </Typography>
        </Box>
      )}

      <Grid container spacing={3}>
        {filtered.map(profile => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={profile.id}>
            <Card sx={{
              height: '100%', display: 'flex', flexDirection: 'column',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }
            }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, flexGrow: 1 }}>
                <Avatar
                  src={profile.avatar_url || undefined}
                  sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2rem', mt: 1 }}
                >
                  {profile.full_name?.charAt(0) || profile.username?.charAt(0) || '?'}
                </Avatar>
                <Box textAlign="center">
                  <Typography fontWeight={700}>{profile.full_name || 'No Name'}</Typography>
                  <Typography variant="body2" color="text.secondary">@{profile.username}</Typography>
                </Box>
                {profile.location && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationOnIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">{profile.location}</Typography>
                  </Box>
                )}
                {profile.bio && (
                  <Typography variant="body2" color="text.secondary" textAlign="center" sx={{
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                  }}>
                    {profile.bio}
                  </Typography>
                )}
                {profile.skills && profile.skills.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
                    {profile.skills.slice(0, 3).map(skill => (
                      <Chip key={skill} label={skill} size="small" variant="outlined" color="primary" />
                    ))}
                    {profile.skills.length > 3 && (
                      <Chip label={`+${profile.skills.length - 3}`} size="small" />
                    )}
                  </Box>
                )}
                <Button variant="contained" fullWidth sx={{ mt: 'auto' }}
                  onClick={() => navigate(`/profile/${profile.id}`)}>
                  View Profile
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Home;