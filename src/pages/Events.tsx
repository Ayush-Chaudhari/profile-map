import React, { useEffect, useState } from 'react';
import {
  Container, Box, Typography, Grid, Card, CardContent,
  Button, Chip, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleIcon from '@mui/icons-material/People';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Event } from '../types';
import { useAuth } from '../context/AuthContext';
import LocationSearch from '../components/LocationSearch';

const Events: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', cover_url: '',
    location: '', lat: '', lng: '', event_date: ''
  });

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('events')
      .select('*, profiles!events_creator_id_fkey(*), event_rsvps(*)')
      .order('event_date', { ascending: true });
    setLoading(false);
    setEvents(data || []);
  };

  const handleCreate = async () => {
    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!form.event_date) { setError('Date is required'); return; }
    setCreating(true);
    const { data, error } = await supabase.from('events').insert({
      title: form.title.trim(),
      description: form.description || null,
      cover_url: form.cover_url || null,
      creator_id: user!.id,
      location: form.location || null,
      lat: form.lat ? parseFloat(form.lat) : null,
      lng: form.lng ? parseFloat(form.lng) : null,
      event_date: new Date(form.event_date).toISOString(),
    }).select().single();

    if (error) { setError(error.message); setCreating(false); return; }

    // Auto RSVP creator
    await supabase.from('event_rsvps').insert({ event_id: data.id, user_id: user!.id });

    setCreating(false);
    setOpen(false);
    setForm({ title: '', description: '', cover_url: '', location: '', lat: '', lng: '', event_date: '' });
    fetchEvents();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const isPast = (date: string) => new Date(date) < new Date();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Events</Typography>
          <Typography variant="body1" color="text.secondary">Discover and join events near you.</Typography>
        </Box>
        {user && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
            Create Event
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={3}>
          {events.map(event => (
            <Grid item xs={12} sm={6} md={4} key={event.id}>
              <Card sx={{
                height: '100%', display: 'flex', flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                opacity: isPast(event.event_date) ? 0.7 : 1,
                '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }
              }}>
                {event.cover_url ? (
                  <Box component="img" src={event.cover_url} alt={event.title}
                    sx={{ width: '100%', height: 160, objectFit: 'cover' }} />
                ) : (
                  <Box sx={{ height: 160, bgcolor: 'secondary.main', display: 'flex',
                    alignItems: 'center', justifyContent: 'center' }}>
                    <EventIcon sx={{ fontSize: 48, color: 'white' }} />
                  </Box>
                )}
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h6" fontWeight={700}>{event.title}</Typography>
                    {isPast(event.event_date) && <Chip label="Past" size="small" />}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <EventIcon fontSize="small" color="primary" />
                    <Typography variant="body2" color="primary.main" fontWeight={600}>
                      {formatDate(event.event_date)}
                    </Typography>
                  </Box>
                  {event.location && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationOnIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">{event.location}</Typography>
                    </Box>
                  )}
                  {event.description && (
                    <Typography variant="body2" color="text.secondary" sx={{
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                    }}>
                      {event.description}
                    </Typography>
                  )}
                  <Chip icon={<PeopleIcon />}
                    label={`${event.event_rsvps?.length || 0} going`}
                    size="small" variant="outlined" sx={{ alignSelf: 'flex-start' }} />
                  <Button variant="contained" fullWidth sx={{ mt: 'auto' }}
                    onClick={() => navigate(`/events/${event.id}`)}>
                    View Event
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {events.length === 0 && (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary">No events yet. Create the first one!</Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}

      {/* Create Event Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create an Event</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Event Title *" value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))} fullWidth />
            <TextField label="Description" value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              fullWidth multiline rows={3} />
            <TextField label="Cover Image URL" value={form.cover_url}
              onChange={e => setForm(p => ({ ...p, cover_url: e.target.value }))}
              fullWidth placeholder="https://..." />
            <TextField
              label="Date & Time *" type="datetime-local" value={form.event_date}
              onChange={e => setForm(p => ({ ...p, event_date: e.target.value }))}
              fullWidth InputLabelProps={{ shrink: true }}
            />
            <LocationSearch
              value={form.location}
              onChange={(location: string, lat: string, lng: string) => setForm(p => ({ ...p, location, lat, lng }))}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={creating}>
            {creating ? <CircularProgress size={20} /> : 'Create Event'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Events;