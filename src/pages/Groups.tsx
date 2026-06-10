import React, { useEffect, useState } from 'react';
import {
  Container, Box, Typography, Grid, Card, CardContent,
  CardMedia, Button, Avatar, Chip, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PeopleIcon from '@mui/icons-material/People';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Group } from '../types';
import { useAuth } from '../context/AuthContext';
import LocationSearch from '../components/LocationSearch';

const Groups: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', cover_url: '',
    location: '', lat: '', lng: ''
  });

  useEffect(() => { fetchGroups(); }, []);

  const fetchGroups = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('groups')
      .select('*, group_members(*)')
      .order('created_at', { ascending: false });
    setLoading(false);
    setGroups(data || []);
  };

  const handleCreate = async () => {
    if (!form.name.trim()) { setError('Group name is required'); return; }
    setCreating(true);
    const { data, error } = await supabase.from('groups').insert({
      name: form.name.trim(),
      description: form.description || null,
      cover_url: form.cover_url || null,
      creator_id: user!.id,
      location: form.location || null,
      lat: form.lat ? parseFloat(form.lat) : null,
      lng: form.lng ? parseFloat(form.lng) : null,
    }).select().single();

    if (error) { setError(error.message); setCreating(false); return; }

    // Auto join as admin
    await supabase.from('group_members').insert({
      group_id: data.id, user_id: user!.id, role: 'admin'
    });

    setCreating(false);
    setOpen(false);
    setForm({ name: '', description: '', cover_url: '', location: '', lat: '', lng: '' });
    navigate(`/groups/${data.id}`);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Groups</Typography>
          <Typography variant="body1" color="text.secondary">Join communities that match your interests.</Typography>
        </Box>
        {user && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
            Create Group
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={3}>
          {groups.map(group => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={group.id}>
              <Card sx={{
                height: '100%', display: 'flex', flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }
              }}>
                {group.cover_url ? (
                  <CardMedia component="img" height="140" image={group.cover_url} alt={group.name} />
                ) : (
                  <Box sx={{ height: 140, bgcolor: 'primary.main', display: 'flex',
                    alignItems: 'center', justifyContent: 'center' }}>
                    <PeopleIcon sx={{ fontSize: 48, color: 'white' }} />
                  </Box>
                )}
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="h6" fontWeight={700}>{group.name}</Typography>
                  {group.description && (
                    <Typography variant="body2" color="text.secondary" sx={{
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                    }}>
                      {group.description}
                    </Typography>
                  )}
                  {group.location && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationOnIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">{group.location}</Typography>
                    </Box>
                  )}
                  <Chip
                    icon={<PeopleIcon />}
                    label={`${group.group_members?.length || 0} members`}
                    size="small" variant="outlined" sx={{ alignSelf: 'flex-start' }}
                  />
                  <Button variant="contained" fullWidth sx={{ mt: 'auto' }}
                    onClick={() => navigate(`/groups/${group.id}`)}>
                    View Group
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {groups.length === 0 && (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary">No groups yet. Create the first one!</Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}

      {/* Create Group Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create a Group</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Group Name *" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} fullWidth />
            <TextField label="Description" value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              fullWidth multiline rows={3} />
            <TextField label="Cover Image URL" value={form.cover_url}
              onChange={e => setForm(p => ({ ...p, cover_url: e.target.value }))}
              fullWidth placeholder="https://..." />
            <LocationSearch
              value={form.location}
              onChange={(location: string, lat: string, lng: string) => setForm(p => ({ ...p, location, lat, lng }))}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={creating}>
            {creating ? <CircularProgress size={20} /> : 'Create Group'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Groups;