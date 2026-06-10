import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Container, Box, TextField, Button, Typography, Paper, Alert, CircularProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError('Invalid email or password');
    } else {
      navigate('/');
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 2 }}>
          <Typography variant="h5" fontWeight={700} textAlign="center" gutterBottom>Welcome Back</Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
            Sign in to your account
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required fullWidth autoFocus />
            <TextField label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required fullWidth />
            <Button type="submit" variant="contained" fullWidth size="large" disabled={loading} sx={{ mt: 1 }}>
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </Box>
          <Typography variant="body2" textAlign="center" sx={{ mt: 2 }}>
            Don't have an account? <RouterLink to="/register">Sign up</RouterLink>
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;