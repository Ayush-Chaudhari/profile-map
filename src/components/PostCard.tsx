import React, { useState } from 'react';
import {
  Card, CardContent, Box, Typography, Avatar, IconButton,
  TextField, Button, Divider, Chip
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Post } from '../types';
import { useAuth } from '../context/AuthContext';

interface PostCardProps {
  post: Post;
  onDelete?: () => void;
}

const timeAgo = (date: string) => {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const PostCard: React.FC<PostCardProps> = ({ post, onDelete }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(post.likes?.some(l => l.user_id === user?.id) || false);
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [commentText, setCommentText] = useState('');
  const [commenting, setCommenting] = useState(false);

  const handleLike = async () => {
    if (!user) { navigate('/login'); return; }
    if (liked) {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('post_id', post.id);
      setLiked(false);
      setLikeCount(c => c - 1);
    } else {
      await supabase.from('likes').insert({ user_id: user.id, post_id: post.id });
      setLiked(true);
      setLikeCount(c => c + 1);
    }
  };

  const handleComment = async () => {
    if (!user || !commentText.trim()) return;
    setCommenting(true);
    const { data } = await supabase.from('comments')
      .insert({ user_id: user.id, post_id: post.id, content: commentText.trim() })
      .select('*, profiles(*)').single();
    setCommenting(false);
    if (data) {
      setComments(prev => [...prev, data]);
      setCommentText('');
    }
  };

  const handleDelete = async () => {
    await supabase.from('posts').delete().eq('id', post.id);
    if (onDelete) onDelete();
  };

  const profile = post.profiles;

  return (
    <Card elevation={2} sx={{ borderRadius: 3, mb: 2 }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}
            onClick={() => navigate(`/profile/${post.user_id}`)}>
            <Avatar src={profile?.avatar_url || undefined} sx={{ bgcolor: 'primary.main' }}>
              {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || '?'}
            </Avatar>
            <Box>
              <Typography fontWeight={700} variant="body1">
                {profile?.full_name || 'Unknown'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                @{profile?.username || 'unknown'} · {timeAgo(post.created_at)}
              </Typography>
            </Box>
          </Box>
          {user?.id === post.user_id && (
            <IconButton size="small" color="error" onClick={handleDelete}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>

        {/* Content */}
        <Typography variant="body1" sx={{ mb: 1.5, lineHeight: 1.8 }}>{post.content}</Typography>

        {post.image_url && (
          <Box component="img" src={post.image_url} alt="post"
            sx={{ width: '100%', borderRadius: 2, mb: 1.5, maxHeight: 400, objectFit: 'cover' }} />
        )}

        {/* Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton size="small" onClick={handleLike} color={liked ? 'error' : 'default'}>
              {liked ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
            </IconButton>
            <Typography variant="body2" color="text.secondary">{likeCount}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton size="small" onClick={() => setShowComments(!showComments)}>
              <ChatBubbleOutlineIcon fontSize="small" />
            </IconButton>
            <Typography variant="body2" color="text.secondary">{comments.length}</Typography>
          </Box>
        </Box>

        {/* Comments */}
        {showComments && (
          <>
            <Divider sx={{ my: 1.5 }} />
            {comments.map(comment => (
              <Box key={comment.id} sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                <Avatar
                  src={comment.profiles?.avatar_url || undefined}
                  sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.8rem', cursor: 'pointer' }}
                  onClick={() => navigate(`/profile/${comment.user_id}`)}
                >
                  {comment.profiles?.full_name?.charAt(0) || '?'}
                </Avatar>
                <Box sx={{ bgcolor: 'grey.100', borderRadius: 2, px: 1.5, py: 1, flexGrow: 1 }}>
                  <Typography variant="caption" fontWeight={700}>
                    {comment.profiles?.full_name || 'Unknown'}
                  </Typography>
                  <Typography variant="body2">{comment.content}</Typography>
                </Box>
              </Box>
            ))}
            {user && (
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Avatar src={undefined} sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.8rem' }}>
                  {user.email?.charAt(0).toUpperCase()}
                </Avatar>
                <TextField
                  size="small" fullWidth placeholder="Write a comment..."
                  value={commentText} onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment(); } }}
                />
                <Button variant="contained" size="small" onClick={handleComment} disabled={commenting || !commentText.trim()}>
                  Post
                </Button>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PostCard;