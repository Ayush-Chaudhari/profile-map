import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Feed from './pages/Feed';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProfilePage from './pages/ProfilePage';
import EditProfile from './pages/EditProfile';
import PeopleMap from './pages/PeopleMap';
import Messages from './pages/Messages';
import Groups from './pages/Groups';
import GroupPage from './pages/GroupPage';
import Events from './pages/Events';
import EventPage from './pages/EventPage';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    background: { default: '#f5f7fa' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600 }
      }
    }
  }
});

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Navbar />
          <Routes>
            <Route path="/" element={<Feed />} />
            <Route path="/people" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/map" element={<PeopleMap />} />
            <Route path="/profile/:id" element={<ProfilePage />} />
            <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/groups/:id" element={<GroupPage />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventPage />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;