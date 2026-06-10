import React, { useEffect, useState, useRef } from 'react';
import {
  Container, Box, Typography, Avatar, CircularProgress,
  TextField, Button, Paper, Divider, Badge, List,
  ListItem, ListItemAvatar, ListItemText
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Profile, Message } from '../types';
import { useNavigate, useSearchParams } from 'react-router-dom';

const Messages: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchConversations();

    // Check if we should open a specific conversation
    const userId = searchParams.get('user');
    if (userId) openConversationById(userId);
  }, [user]);

  useEffect(() => {
    if (!selectedUser || !user) return;
    fetchMessages();

    // Realtime subscription
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, payload => {
        const msg = payload.new as Message;
        if (
          (msg.sender_id === user.id && msg.receiver_id === selectedUser.id) ||
          (msg.sender_id === selectedUser.id && msg.receiver_id === user.id)
        ) {
          setMessages(prev => [...prev, msg]);
          scrollToBottom();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedUser]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('messages')
      .select('sender_id, receiver_id')
      .or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`);

    if (!data) { setLoading(false); return; }

    const userIds = new Set<string>();
    data.forEach(m => {
      if (m.sender_id !== user!.id) userIds.add(m.sender_id);
      if (m.receiver_id !== user!.id) userIds.add(m.receiver_id);
    });

    if (userIds.size === 0) { setLoading(false); return; }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', Array.from(userIds));

    setConversations(profiles || []);
    setLoading(false);
  };

  const openConversationById = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setSelectedUser(data);
  };

  const fetchMessages = async () => {
    if (!selectedUser || !user) return;
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    setMessages(data || []);

    // Mark as read
    await supabase.from('messages')
      .update({ read: true })
      .eq('sender_id', selectedUser.id)
      .eq('receiver_id', user.id)
      .eq('read', false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !user) return;
    setSending(true);
    await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: selectedUser.id,
      content: newMessage.trim(),
    });
    setSending(false);
    setNewMessage('');

    if (!conversations.find(c => c.id === selectedUser.id)) {
      setConversations(prev => [selectedUser, ...prev]);
    }
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>Messages</Typography>
      <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden', height: '70vh', display: 'flex' }}>

        {/* Conversations list */}
        <Box sx={{ width: 280, borderRight: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" fontWeight={600}>Conversations</Typography>
          </Box>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress size={24} /></Box>
          ) : conversations.length === 0 ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                No conversations yet. Go to someone's profile and message them!
              </Typography>
            </Box>
          ) : (
            <List sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
              {conversations.map(conv => (
                <ListItem
                  key={conv.id}
                  onClick={() => setSelectedUser(conv)}
                  sx={{
                    cursor: 'pointer',
                    bgcolor: selectedUser?.id === conv.id ? 'primary.light' : 'transparent',
                    '&:hover': { bgcolor: 'grey.100' }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar src={conv.avatar_url || undefined} sx={{ bgcolor: 'primary.main' }}>
                      {conv.full_name?.charAt(0) || conv.username?.charAt(0) || '?'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={conv.full_name || conv.username}
                    secondary={`@${conv.username}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        {/* Chat area */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {!selectedUser ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography color="text.secondary">Select a conversation or go to a profile to start messaging</Typography>
            </Box>
          ) : (
            <>
              {/* Chat header */}
              <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar
                  src={selectedUser.avatar_url || undefined}
                  sx={{ bgcolor: 'primary.main', cursor: 'pointer' }}
                  onClick={() => navigate(`/profile/${selectedUser.id}`)}
                >
                  {selectedUser.full_name?.charAt(0) || '?'}
                </Avatar>
                <Box>
                  <Typography fontWeight={600}>{selectedUser.full_name || selectedUser.username}</Typography>
                  <Typography variant="caption" color="text.secondary">@{selectedUser.username}</Typography>
                </Box>
              </Box>

              {/* Messages */}
              <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {messages.map(msg => (
                  <Box key={msg.id} sx={{
                    display: 'flex',
                    justifyContent: msg.sender_id === user!.id ? 'flex-end' : 'flex-start'
                  }}>
                    <Box sx={{
                      maxWidth: '70%', px: 2, py: 1, borderRadius: 3,
                      bgcolor: msg.sender_id === user!.id ? 'primary.main' : 'grey.100',
                      color: msg.sender_id === user!.id ? 'white' : 'text.primary',
                    }}>
                      <Typography variant="body2">{msg.content}</Typography>
                      <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.65rem' }}>
                        {timeAgo(msg.created_at)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
                <div ref={messagesEndRef} />
              </Box>

              {/* Input */}
              <Divider />
              <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth size="small" placeholder="Type a message..."
                  value={newMessage} onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                />
                <Button variant="contained" onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                  <SendIcon fontSize="small" />
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default Messages;