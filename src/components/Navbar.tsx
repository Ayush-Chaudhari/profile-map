import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Button, Box, Avatar,
  Menu, MenuItem, Divider, IconButton, Badge
} from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import PeopleIcon from '@mui/icons-material/People';
import MessageIcon from '@mui/icons-material/Message';
import DynamicFeedIcon from '@mui/icons-material/DynamicFeed';
import GroupsIcon from '@mui/icons-material/Groups';
import EventIcon from '@mui/icons-material/Event';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetchUnread();
    const channel = supabase
      .channel('unread')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const msg = payload.new as any;
        if (msg.receiver_id === user.id) setUnreadCount(c => c + 1);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchUnread = async () => {
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user!.id)
      .eq('read', false);
    setUnreadCount(count || 0);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setAnchor(null);
  };

  return (
    <AppBar position="static" elevation={2}>
      <Toolbar>
        <MapIcon sx={{ mr: 1 }} />
        <Typography variant="h6" component={RouterLink} to="/"
          sx={{ textDecoration: 'none', color: 'inherit', fontWeight: 700, mr: 2 }}>
          ProfileMap
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexGrow: 1 }}>
          <Button color="inherit" component={RouterLink} to="/" startIcon={<DynamicFeedIcon />}>Feed</Button>
          <Button color="inherit" component={RouterLink} to="/people" startIcon={<PeopleIcon />}>People</Button>
          <Button color="inherit" component={RouterLink} to="/map" startIcon={<MapIcon />}>Map</Button>
          <Button color="inherit" component={RouterLink} to="/groups" startIcon={<GroupsIcon />}>Groups</Button>
          <Button color="inherit" component={RouterLink} to="/events" startIcon={<EventIcon />}>Events</Button>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {user ? (
            <>
              <IconButton color="inherit" onClick={() => { setUnreadCount(0); navigate('/messages'); }}>
                <Badge badgeContent={unreadCount} color="error">
                  <MessageIcon />
                </Badge>
              </IconButton>
              <IconButton onClick={e => setAnchor(e.currentTarget)}>
                <Avatar sx={{ width: 34, height: 34, bgcolor: 'white', color: 'primary.main', fontSize: '0.9rem' }}>
                  {user.email?.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
                <MenuItem onClick={() => { navigate(`/profile/${user.id}`); setAnchor(null); }}>My Profile</MenuItem>
                <MenuItem onClick={() => { navigate('/edit-profile'); setAnchor(null); }}>Edit Profile</MenuItem>
                <MenuItem onClick={() => { navigate('/messages'); setAnchor(null); }}>Messages</MenuItem>
                <Divider />
                <MenuItem onClick={handleSignOut} sx={{ color: 'error.main' }}>Sign Out</MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button color="inherit" component={RouterLink} to="/login">Login</Button>
              <Button variant="outlined" color="inherit" component={RouterLink} to="/register">Sign Up</Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;