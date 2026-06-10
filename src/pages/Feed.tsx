import React, { useEffect, useState } from 'react';
import {
  Container, Box, Typography, CircularProgress,
  Alert, Tabs, Tab
} from '@mui/material';
import DynamicFeedIcon from '@mui/icons-material/DynamicFeed';
import PublicIcon from '@mui/icons-material/Public';
import { supabase } from '../lib/supabase';
import { Post } from '../types';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';

const Feed: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0);

  useEffect(() => {
    fetchPosts();
  }, [tab]);

  const fetchPosts = async () => {
    setLoading(true);
    setError('');

    let query = supabase
      .from('posts')
      .select(`
        *,
        profiles!posts_user_id_fkey(*),
        likes(*),
        comments(*, profiles!comments_user_id_fkey(*))
      `)
      .order('created_at', { ascending: false });

    if (tab === 0 && user) {
      // Following feed
      const { data: follows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      const followingIds = follows?.map(f => f.following_id) || [];
      followingIds.push(user.id); // include own posts

      query = query.in('user_id', followingIds);
    }

    const { data, error } = await query.limit(50);
    setLoading(false);
    if (error) { setError(error.message); return; }
    setPosts(data || []);
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>Feed</Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab icon={<DynamicFeedIcon />} label="Following" iconPosition="start" />
        <Tab icon={<PublicIcon />} label="Discover" iconPosition="start" />
      </Tabs>

      {user && <CreatePost onPost={fetchPosts} />}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {!loading && posts.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            {tab === 0
              ? 'No posts yet. Follow people to see their posts here!'
              : 'No posts yet. Be the first to post!'}
          </Typography>
        </Box>
      )}

      {posts.map(post => (
        <PostCard key={post.id} post={post} onDelete={fetchPosts} />
      ))}
    </Container>
  );
};

export default Feed;