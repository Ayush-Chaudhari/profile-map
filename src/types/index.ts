export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  skills: string[] | null;
  location: string | null;
  lat: number | null;
  lng: number | null;
  website: string | null;
  created_at: string;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  profiles?: Profile;
  likes?: Like[];
  comments?: Comment[];
}

export interface Like {
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
  sender?: Profile;
  receiver?: Profile;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  creator_id: string;
  location: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
  group_members?: GroupMember[];
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profiles?: Profile;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  creator_id: string;
  group_id: string | null;
  location: string | null;
  lat: number | null;
  lng: number | null;
  event_date: string;
  created_at: string;
  profiles?: Profile;
  event_rsvps?: EventRsvp[];
}

export interface EventRsvp {
  event_id: string;
  user_id: string;
  status: string;
  created_at: string;
  profiles?: Profile;
}