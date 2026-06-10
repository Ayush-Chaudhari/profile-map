import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Button, Avatar, Paper,
  Grid, Chip, CircularProgress, Alert, Divider, AvatarGroup
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { supabase } from '../lib/supabase';
import { Group, Post } from '../types';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import MapView from '../components/MapView';

const GroupPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMember, setIsMember] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchGroup();
    fetchPosts();
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    checkMembership();
  }, [user, id]);

  const fetchGroup = async () => {
    const { data, error } = await supabase
      .from('groups')
      .select('*, group_members(*, profiles(*))')
      .eq('id', id)
      .single();
    setLoading(false);
    if (error) { setError('Group not found.'); return; }
    setGroup(data);
    setMemberCount(data.group_members?.length || 0);
  };

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select(`
        *,
        profiles!posts_user_id_fkey(*),
        likes(*),
        comments(*, profiles!comments_user_id_fkey(*))
      `)
      .eq('group_id', id)
      .order('created_at', { ascending: false });
    setPosts(data || []);
  };

  const checkMembership = async () => {
    const { data } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', id)
      .eq('user_id', user!.id)
      .single();
    setIsMember(!!data);
  };

  const handleJoin = async () => {
    if (!user) { navigate('/login'); return; }
    setJoining(true);
    if (isMember) {
      await supabase.from('group_members').delete()
        .eq('group_id', id).eq('user_id', user.id);
      setIsMember(false);
      setMemberCount(c => c - 1);
    } else {
      await supabase.from('group_members').insert({
        group_id: id, user_id: user.id, role: 'member'
      });
      setIsMember(true);
      setMemberCount(c => c + 1);
    }
    setJoining(false);
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  if (error || !group) return <Container sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;

  const members = group.group_members || [];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/groups')} sx={{ mb: 3 }}>
        Back to Groups
      </Button>

      <Grid container spacing={4}>
        {/* Left — group info */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
            {group.cover_url ? (
              <Box component="img" src={group.cover_url} alt={group.name}
                sx={{ width: '100%', height: 180, objectFit: 'cover' }} />
            ) : (
              <Box sx={{ height: 180, bgcolor: 'primary.main', display: 'flex',
                alignItems: 'center', justifyContent: 'center' }}>
                <PeopleIcon sx={{ fontSize: 64, color: 'white' }} />
              </Box>
            )}
            <Box sx={{ p: 3 }}>
              <Typography variant="h5" fontWeight={700} gutterBottom>{group.name}</Typography>
              {group.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.8 }}>
                  {group.description}
                </Typography>
              )}
              {group.location && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                  <LocationOnIcon fontSize="small" color="action" />
                  <Typography variant="body2">{group.location}</Typography>
                </Box>
              )}
              <Chip icon={<PeopleIcon />} label={`${memberCount} members`} size="small" sx={{ mb: 2 }} />

              {user && user.id !== group.creator_id && (
                <Button fullWidth variant={isMember ? 'outlined' : 'contained'}
                  onClick={handleJoin} disabled={joining}>
                  {isMember ? 'Leave Group' : 'Join Group'}
                </Button>
              )}

              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>Members</Typography>
              <AvatarGroup max={8} sx={{ justifyContent: 'flex-start' }}>
                {members.map(m => (
                  <Avatar
                    key={m.user_id}
                    src={m.profiles?.avatar_url || undefined}
                    sx={{ cursor: 'pointer', width: 36, height: 36 }}
                    onClick={() => navigate(`/profile/${m.user_id}`)}
                  >
                    {m.profiles?.full_name?.charAt(0) || '?'}
                  </Avatar>
                ))}
              </AvatarGroup>
            </Box>
          </Paper>

          {group.lat && group.lng && (
            <Paper elevation={2} sx={{ borderRadius: 3, p: 2, mt: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>Location</Typography>
              <MapView profiles={[{ ...group, id: group.id } as any]} height="200px" />
            </Paper>
          )}
        </Grid>

        {/* Right — posts */}
        <Grid item xs={12} md={8}>
          <Typography variant="h6" fontWeight={600} gutterBottom>Discussions</Typography>
          {user && isMember && (
            <CreatePost onPost={fetchPosts} groupId={id} />
          )}
          {!isMember && (
            <Alert severity="info" sx={{ mb: 2 }}>Join this group to post and participate in discussions.</Alert>
          )}
          {posts.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography color="text.secondary">No posts yet. Be the first to post!</Typography>
            </Box>
          ) : posts.map(post => (
            <PostCard key={post.id} post={post} onDelete={fetchPosts} />
          ))}
        </Grid>
      </Grid>
    </Container>
  );
};

export default GroupPage;