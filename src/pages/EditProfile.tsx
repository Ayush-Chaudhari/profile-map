import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, TextField, Button, Typography, Paper,
  Alert, CircularProgress, Chip, Grid
} from '@mui/material';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import LocationSearch from '../components/LocationSearch';

const EditProfile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [form, setForm] = useState({
    username: '', full_name: '', bio: '', avatar_url: '',
    location: '', lat: '', lng: '', website: '', skills: [] as string[]
  });

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setForm({
          username: data.username || '',
          full_name: data.full_name || '',
          bio: data.bio || '',
          avatar_url: data.avatar_url || '',
          location: data.location || '',
          lat: data.lat?.toString() || '',
          lng: data.lng?.toString() || '',
          website: data.website || '',
          skills: data.skills || [],
        });
      }
      setFetching(false);
    };
    fetch();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) {
      setForm(prev => ({ ...prev, skills: [...prev.skills, s] }));
    }
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    setForm(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim()) { setError('Username is required'); return; }
    setLoading(true);
    setError('');

    const { error } = await supabase.from('profiles').upsert({
      id: user!.id,
      username: form.username.trim(),
      full_name: form.full_name || null,
      bio: form.bio || null,
      avatar_url: form.avatar_url || null,
      location: form.location || null,
      lat: form.lat ? parseFloat(form.lat) : null,
      lng: form.lng ? parseFloat(form.lng) : null,
      website: form.website || null,
      skills: form.skills.length > 0 ? form.skills : null,
    });

    setLoading(false);
    if (error) { setError(error.message); return; }
    setSuccess('Profile saved!');
    setTimeout(() => navigate(`/profile/${user!.id}`), 1000);
  };

  if (fetching) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>Edit Profile</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField label="Username *" name="username" value={form.username} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Full Name" name="full_name" value={form.full_name} onChange={handleChange} fullWidth />
            </Grid>
          </Grid>
          <TextField label="Bio" name="bio" value={form.bio} onChange={handleChange}
            fullWidth multiline rows={3} placeholder="Tell people about yourself..." />
          <TextField label="Avatar URL" name="avatar_url" value={form.avatar_url}
            onChange={handleChange} fullWidth placeholder="https://..." />
          <LocationSearch
            value={form.location}
            onChange={(location, lat, lng) => setForm(prev => ({ ...prev, location, lat, lng }))}
          />
          <TextField label="Website" name="website" value={form.website}
            onChange={handleChange} fullWidth placeholder="https://..." />
          <Box>
            <Typography variant="subtitle2" gutterBottom>Skills</Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField size="small" placeholder="Add a skill (e.g. React)"
                value={skillInput} onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                sx={{ flexGrow: 1 }} />
              <Button variant="outlined" onClick={addSkill}>Add</Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {form.skills.map(skill => (
                <Chip key={skill} label={skill} onDelete={() => removeSkill(skill)} size="small" />
              ))}
            </Box>
          </Box>
          <Button type="submit" variant="contained" fullWidth size="large" disabled={loading} sx={{ mt: 1 }}>
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Save Profile'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default EditProfile;