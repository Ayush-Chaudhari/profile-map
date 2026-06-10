import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { Button, Typography } from '@mui/material';
import { Profile } from '../types';
import 'leaflet/dist/leaflet.css';

const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

interface MapViewProps {
  profiles: Profile[];
  selectedId?: string;
  height?: string;
}

const FlyToSelected: React.FC<{ profile?: Profile }> = ({ profile }) => {
  const map = useMap();
  if (profile?.lat && profile?.lng) {
    map.flyTo([profile.lat, profile.lng], 13, { duration: 1.5 });
  }
  return null;
};

const MapView: React.FC<MapViewProps> = ({ profiles, selectedId, height = '400px' }) => {
  const navigate = useNavigate();
  const validProfiles = profiles.filter(p => p.lat && p.lng);
  const selectedProfile = profiles.find(p => p.id === selectedId);

  const center: [number, number] = validProfiles.length > 0
    ? [validProfiles[0].lat!, validProfiles[0].lng!]
    : [20.5937, 78.9629];

  return (
    <MapContainer center={center} zoom={5} style={{ height, width: '100%', borderRadius: '8px' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {validProfiles.map(profile => (
        <Marker key={profile.id} position={[profile.lat!, profile.lng!]} icon={defaultIcon}>
          <Popup>
  <Typography variant="subtitle2" fontWeight={700}>
    {(profile as any).full_name || (profile as any).name || 'Unknown'}
  </Typography>
  <Typography variant="body2" color="text.secondary">
    {(profile as any).title || (profile as any).username || ''}
  </Typography>
  <Typography variant="body2">{(profile as any).address || (profile as any).location || ''}</Typography>
  <Button size="small" variant="contained" sx={{ mt: 1 }}
    onClick={() => navigate(`/profile/${profile.id}`)}>
    View Profile
  </Button>
</Popup>
        </Marker>
      ))}
      <FlyToSelected profile={selectedProfile} />
    </MapContainer>
  );
};

export default MapView;