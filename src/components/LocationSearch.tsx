import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Paper, Typography, CircularProgress } from '@mui/material';

interface LocationResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationSearchProps {
  value: string;
  onChange: (location: string, lat: string, lng: string) => void;
}

const LocationSearch: React.FC<LocationSearchProps> = ({ value, onChange }) => {
  const [input, setInput] = useState(value);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setInput(value); }, [value]);

  const handleInput = (val: string) => {
    setInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) { setResults([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=5`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        setResults(data);
        setOpen(true);
      } catch { }
      setSearching(false);
    }, 500);
  };

  const handleSelect = (result: LocationResult) => {
    setInput(result.display_name);
    setOpen(false);
    onChange(result.display_name, result.lat, result.lon);
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <TextField
        fullWidth label="Location"
        value={input}
        onChange={e => handleInput(e.target.value)}
        placeholder="Search for a location..."
        InputProps={{ endAdornment: searching ? <CircularProgress size={18} /> : null }}
      />
      {open && results.length > 0 && (
        <Paper elevation={4} sx={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          zIndex: 1000, maxHeight: 250, overflow: 'auto', mt: 0.5
        }}>
          {results.map((r, i) => (
            <Box key={i} onClick={() => handleSelect(r)} sx={{
              px: 2, py: 1.5, cursor: 'pointer', borderBottom: '1px solid',
              borderColor: 'divider',
              '&:hover': { bgcolor: 'primary.light' },
              '&:last-child': { borderBottom: 'none' }
            }}>
              <Typography variant="body2">{r.display_name}</Typography>
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  );
};

export default LocationSearch;