import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Chip, Button, Avatar,
  Paper, Divider, CircularProgress, Alert, Grid
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LinkIcon from '@mui/icons-material/Link';
import PeopleIcon from '@mui/icons-material/People';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { useAuth } from '../context/AuthContext';
import MapView from '../components/MapView';
import MessageIcon from '@mui/icons-material/Message';

const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchProfile();
    fetchFollowCounts();
    if (user) checkFollowing();
  }, [id, user]);

  const fetchProfile = async () => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    setLoading(false);
    if (error) { setError('Profile not found.'); return; }
    setProfile(data);
  };

  const fetchFollowCounts = async () => {
    const [{ count: followers }, { count: following }] = await Promise.all([
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', id),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', id),
    ]);
    setFollowerCount(followers || 0);
    setFollowingCount(following || 0);
  };

  const checkFollowing = async () => {
    const { data } = await supabase.from('follows')
      .select('*').eq('follower_id', user!.id).eq('following_id', id).single();
    setIsFollowing(!!data);
  };

  const handleFollow = async () => {
    if (!user) { navigate('/login'); return; }
    setFollowLoading(true);
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', id);
      setIsFollowing(false);
      setFollowerCount(c => c - 1);
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: id });
      setIsFollowing(true);
      setFollowerCount(c => c + 1);
    }
    setFollowLoading(false);
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  if (error || !profile) return <Container sx={{ mt: 4 }}><Alert severity="error">{error || 'Profile not found'}</Alert></Container>;

  const isOwn = user?.id === id;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        <Grid item xs={12} md={5}>
          <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Avatar
                src={profile.avatar_url || undefined}
                sx={{ width: 120, height: 120, fontSize: '3rem', bgcolor: 'primary.main', mb: 2 }}
              >
                {profile.full_name?.charAt(0) || profile.username?.charAt(0) || '?'}
              </Avatar>
              <Typography variant="h5" fontWeight={700}>{profile.full_name || 'No Name'}</Typography>
              <Typography variant="body2" color="text.secondary">@{profile.username || 'unnamed'}</Typography>

              <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
                <Box textAlign="center">
                  <Typography fontWeight={700}>{followerCount}</Typography>
                  <Typography variant="caption" color="text.secondary">Followers</Typography>
                </Box>
                <Box textAlign="center">
                  <Typography fontWeight={700}>{followingCount}</Typography>
                  <Typography variant="caption" color="text.secondary">Following</Typography>
                </Box>
              </Box>

              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  {isOwn ? (
                    <Button variant="outlined" startIcon={<EditIcon />} onClick={() => navigate('/edit-profile')}>
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant={isFollowing ? 'outlined' : 'contained'}
                        startIcon={<PeopleIcon />}
                        onClick={handleFollow}
                        disabled={followLoading}
                      >
                        {isFollowing ? 'Unfollow' : 'Follow'}
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<MessageIcon />}
                        onClick={() => navigate(`/messages?user=${id}`)}
                      >
                        Message
                      </Button>
                    </>
                  )}
                </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {profile.bio && (
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2, lineHeight: 1.8 }}>
                {profile.bio}
              </Typography>
            )}

            {profile.location && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <LocationOnIcon fontSize="small" color="action" />
                <Typography variant="body2">{profile.location}</Typography>
              </Box>
            )}

            {profile.website && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LinkIcon fontSize="small" color="action" />
                <Typography variant="body2" component="a" href={profile.website} target="_blank"
                  sx={{ color: 'primary.main' }}>
                  {profile.website}
                </Typography>
              </Box>
            )}

            {profile.skills && profile.skills.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>Skills</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {profile.skills.map(skill => (
                    <Chip key={skill} label={skill} size="small" color="primary" variant="outlined" />
                  ))}
                </Box>
              </>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={7}>
          <Paper elevation={2} sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Location</Typography>
            {profile.lat && profile.lng ? (
              <MapView profiles={[profile]} selectedId={profile.id} height="450px" />
            ) : (
              <Box sx={{ height: 250, display: 'flex', alignItems: 'center',
                justifyContent: 'center', bgcolor: 'grey.100', borderRadius: 2 }}>
                <Typography color="text.secondary">No location set.</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProfilePage;