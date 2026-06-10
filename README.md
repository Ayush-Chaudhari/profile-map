# ProfileMap 🗺️

A full-stack community platform where people can connect, share, and meet up — built with React, TypeScript, and Supabase.

## Live Demo
> Coming soon (deploying on Vercel)

## Features

### 👤 Users
- Sign up / login with email and password
- Build a profile with bio, skills, avatar, and location
- Follow / unfollow other users
- Real-time follower and following counts

### 🗺️ Discovery
- Browse people on an interactive map
- Search by name, username, skill, or location
- Location autocomplete powered by OpenStreetMap

### 📰 Feed
- Post updates with optional images
- Following feed (posts from people you follow)
- Discover feed (all posts)
- Like and comment on posts in real time

### 💬 Messaging
- Real-time direct messaging between users
- Unread message badge in navbar
- Conversation list with chat history

### 👥 Groups
- Create and join interest-based groups
- Group discussion feed
- Member list with avatars
- Group location on map

### 📅 Events
- Create events with date, location, and cover image
- RSVP to events
- Attendee list
- Event location on map
- Past/upcoming event status

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite |
| UI | Material UI (MUI v5) |
| Maps | Leaflet + React-Leaflet |
| Backend | Supabase (PostgreSQL + Auth) |
| Real-time | Supabase Realtime (WebSockets) |
| Location Search | OpenStreetMap Nominatim API |
| Hosting | Vercel (frontend) + Supabase (backend) |

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase account

### Setup

1. Clone the repo
```bash
   git clone https://github.com/Ayush-Chaudhari/profile-map.git
   cd profile-map
```

2. Install dependencies
```bash
   npm install
```

3. Create a `.env` file in the root:
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

4. Set up the database — run the SQL migrations in order from the `/sql` folder in your Supabase SQL editor

5. Start the dev server
```bash
   npm run dev
```

## Database Schema
profiles        — user profiles (extends Supabase auth)
follows         — follow relationships between users
posts           — feed posts with optional images
likes           — post likes
comments        — post comments
messages        — direct messages between users
groups          — community groups
group_members   — group membership
events          — community events
event_rsvps     — event attendance

## Screenshots


## Author
**Ayush Chaudhari**  