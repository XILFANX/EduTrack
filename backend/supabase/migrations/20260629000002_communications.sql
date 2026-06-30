-- Migration: Communications (Announcements & Direct Messaging)

-- 1. Announcements (Global / Group Broadcasts)
create table public.announcements (
  id uuid default uuid_generate_v4() primary key,
  school_id uuid references public.schools(id) not null,
  title text not null,
  body text not null,
  target_audience text not null default 'All', -- 'All', 'Parents', 'Staff', 'Teachers'
  author_id uuid references public.users(id) not null,
  created_at timestamp with time zone default now()
);

-- 2. Conversations (Direct Message Threads)
create table public.conversations (
  id uuid default uuid_generate_v4() primary key,
  school_id uuid references public.schools(id) not null,
  title text, -- Optional, e.g. "Grade 4 Parents" or null for 1-on-1
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3. Conversation Participants
create table public.conversation_participants (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  user_id uuid references public.users(id) not null,
  last_read_at timestamp with time zone default now(),
  joined_at timestamp with time zone default now(),
  unique(conversation_id, user_id)
);

-- 4. Messages
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.users(id) not null,
  content text not null,
  created_at timestamp with time zone default now()
);

-- Basic RLS
alter table public.announcements enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
