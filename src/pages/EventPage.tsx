import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Button, Avatar, Paper,
  Grid, Chip, CircularProgress, Alert, Divider, AvatarGroup
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleIcon from '@mui/icons-material/People';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { supabase } from '../lib/supabase';
import { Event } from '../types';
import { useAuth } from '../context/AuthContext';
import MapView from '../components/MapView';

const EventPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isGoing, setIsGoing] = useState(false);
  const [rsvpCount, setRsvpCount] = useState(0);
  const [rsvping, setRsvping] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchEvent();
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    checkRsvp();
  }, [user, id]);

  const fetchEvent = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*, profiles!events_creator_id_fkey(*), event_rsvps(*, profiles(*))')
      .eq('id', id)
      .single();
    setLoading(false);
    if (error) { setError('Event not found.'); return; }
    setEvent(data);
    setRsvpCount(data.event_rsvps?.length || 0);
  };

  const checkRsvp = async () => {
    const { data } = await supabase
      .from('event_rsvps')
      .select('*')
      .eq('event_id', id)
      .eq('user_id', user!.id)
      .single();
    setIsGoing(!!data);
  };

  const handleRsvp = async () => {
    if (!user) { navigate('/login'); return; }
    setRsvping(true);
    if (isGoing) {
      await supabase.from('event_rsvps').delete()
        .eq('event_id', id).eq('user_id', user.id);
      setIsGoing(false);
      setRsvpCount(c => c - 1);
    } else {
      await supabase.from('event_rsvps').insert({ event_id: id, user_id: user.id });
      setIsGoing(true);
      setRsvpCount(c => c + 1);
    }
    setRsvping(false);
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long',
    day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const isPast = (date: string) => new Date(date) < new Date();

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  if (error || !event) return <Container sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;

  const attendees = event.event_rsvps || [];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/events')} sx={{ mb: 3 }}>
        Back to Events
      </Button>

      <Grid container spacing={4}>
        {/* Left — event info */}
        <Grid item xs={12} md={5}>
          <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
            {event.cover_url ? (
              <Box component="img" src={event.cover_url} alt={event.title}
                sx={{ width: '100%', height: 220, objectFit: 'cover' }} />
            ) : (
              <Box sx={{ height: 220, bgcolor: 'secondary.main', display: 'flex',
                alignItems: 'center', justifyContent: 'center' }}>
                <EventIcon sx={{ fontSize: 80, color: 'white' }} />
              </Box>
            )}
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="h5" fontWeight={700}>{event.title}</Typography>
                {isPast(event.event_date) && <Chip label="Past Event" size="small" />}
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EventIcon color="primary" fontSize="small" />
                  <Typography variant="body2" fontWeight={600} color="primary.main">
                    {formatDate(event.event_date)}
                  </Typography>
                </Box>
                {event.location && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOnIcon color="action" fontSize="small" />
                    <Typography variant="body2">{event.location}</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PeopleIcon color="action" fontSize="small" />
                  <Typography variant="body2">{rsvpCount} people going</Typography>
                </Box>
              </Box>

              {event.description && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                    {event.description}
                  </Typography>
                </>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Organizer */}
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>Organizer</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, cursor: 'pointer' }}
                onClick={() => navigate(`/profile/${event.creator_id}`)}>
                <Avatar src={event.profiles?.avatar_url || undefined} sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                  {event.profiles?.full_name?.charAt(0) || '?'}
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight={600}>{event.profiles?.full_name}</Typography>
                  <Typography variant="caption" color="text.secondary">@{event.profiles?.username}</Typography>
                </Box>
              </Box>

              {!isPast(event.event_date) && user && user.id !== event.creator_id && (
                <Button
                  fullWidth
                  variant={isGoing ? 'outlined' : 'contained'}
                  color={isGoing ? 'success' : 'primary'}
                  startIcon={isGoing ? <CheckCircleIcon /> : undefined}
                  onClick={handleRsvp}
                  disabled={rsvping}
                >
                  {isGoing ? 'Going ✓' : 'RSVP — I\'m Going'}
                </Button>
              )}

              {isGoing && !isPast(event.event_date) && user?.id !== event.creator_id && (
                <Button fullWidth variant="text" color="error" size="small"
                  onClick={handleRsvp} disabled={rsvping} sx={{ mt: 1 }}>
                  Cancel RSVP
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Right — map + attendees */}
        <Grid item xs={12} md={7}>
          {event.lat && event.lng && (
            <Paper elevation={2} sx={{ borderRadius: 3, p: 2, mb: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Location</Typography>
              <MapView profiles={[{ ...event, id: event.id } as any]} height="300px" />
            </Paper>
          )}

          <Paper elevation={2} sx={{ borderRadius: 3, p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Attendees ({rsvpCount})
            </Typography>
            {attendees.length === 0 ? (
              <Typography color="text.secondary" variant="body2">No attendees yet.</Typography>
            ) : (
              <>
                <AvatarGroup max={10} sx={{ justifyContent: 'flex-start', mb: 2 }}>
                  {attendees.map(r => (
                    <Avatar
                      key={r.user_id}
                      src={r.profiles?.avatar_url || undefined}
                      sx={{ cursor: 'pointer', width: 40, height: 40 }}
                      onClick={() => navigate(`/profile/${r.user_id}`)}
                    >
                      {r.profiles?.full_name?.charAt(0) || '?'}
                    </Avatar>
                  ))}
                </AvatarGroup>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {attendees.map(r => (
                    <Chip
                      key={r.user_id}
                      avatar={<Avatar src={r.profiles?.avatar_url || undefined}>
                        {r.profiles?.full_name?.charAt(0) || '?'}
                      </Avatar>}
                      label={r.profiles?.full_name || r.profiles?.username || 'Unknown'}
                      onClick={() => navigate(`/profile/${r.user_id}`)}
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Box>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default EventPage;