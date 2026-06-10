import React, { useState } from 'react';
import { Box, TextField, Button, Avatar, Paper, CircularProgress } from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface CreatePostProps {
  onPost: () => void;
  groupId?: string;
}

const CreatePost: React.FC<CreatePostProps> = ({ onPost, groupId }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImage, setShowImage] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || !user) return;
    setLoading(true);
    await supabase.from('posts').insert({
      user_id: user.id,
      content: content.trim(),
      image_url: imageUrl || null,
      group_id: groupId || null,
    });
    setLoading(false);
    setContent('');
    setImageUrl('');
    setShowImage(false);
    onPost();
  };

  return (
    <Paper elevation={2} sx={{ p: 2.5, borderRadius: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          {user?.email?.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <TextField
            fullWidth multiline rows={2} placeholder="What's on your mind?"
            value={content} onChange={e => setContent(e.target.value)}
            variant="outlined" size="small"
          />
          {showImage && (
            <TextField fullWidth placeholder="Image URL (optional)"
              value={imageUrl} onChange={e => setImageUrl(e.target.value)} size="small" />
          )}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button size="small" startIcon={<ImageIcon />}
              onClick={() => setShowImage(!showImage)} color={showImage ? 'primary' : 'inherit'}>
              Image
            </Button>
            <Button variant="contained" size="small" onClick={handleSubmit}
              disabled={loading || !content.trim()}>
              {loading ? <CircularProgress size={18} color="inherit" /> : 'Post'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default CreatePost;