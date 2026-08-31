-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  date text NOT NULL,
  user_id uuid,
  email text,
  username text,
  text text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  verse_ref text,
  anchor_text text,
  group_id uuid,
  visibility text NOT NULL DEFAULT 'personal'::text,
  CONSTRAINT comments_pkey PRIMARY KEY (id),
  CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT comments_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id)
);
CREATE TABLE public.bible_verses (
  id integer NOT NULL DEFAULT nextval('bible_verses_id_seq'::regclass),
  book text NOT NULL,
  chapter integer NOT NULL,
  verse integer NOT NULL,
  text text NOT NULL,
  version text NOT NULL DEFAULT 'KJV'::text,
  CONSTRAINT bible_verses_pkey PRIMARY KEY (id)
);
CREATE TABLE public.annotations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  book text NOT NULL,
  chapter integer NOT NULL,
  verse integer NOT NULL,
  start_offset integer NOT NULL,
  end_offset integer NOT NULL,
  colour text NOT NULL,
  style text NOT NULL DEFAULT 'highlight'::text,
  shared boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT annotations_pkey PRIMARY KEY (id),
  CONSTRAINT annotations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.groups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid,
  invite_code text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT groups_pkey PRIMARY KEY (id),
  CONSTRAINT groups_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.group_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  group_id uuid,
  user_id uuid,
  role text NOT NULL DEFAULT 'member'::text,
  status text NOT NULL DEFAULT 'pending'::text,
  email text,
  username text,
  joined_at timestamp with time zone DEFAULT now(),
  CONSTRAINT group_members_pkey PRIMARY KEY (id),
  CONSTRAINT group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id),
  CONSTRAINT group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.verse_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  verse_ref text NOT NULL,
  note_text text NOT NULL DEFAULT ''::text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT verse_notes_pkey PRIMARY KEY (id),
  CONSTRAINT verse_notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.ink_pages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  page_key text NOT NULL,
  kind text NOT NULL DEFAULT 'scripture'::text,
  book text,
  chapter integer,
  first_verse integer,
  last_verse integer,
  stroke_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ink_pages_pkey PRIMARY KEY (id),
  CONSTRAINT ink_pages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.word_links (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  book text NOT NULL,
  chapter integer NOT NULL,
  verse integer NOT NULL,
  word text NOT NULL,
  start_offset integer NOT NULL,
  end_offset integer NOT NULL,
  page_key text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT word_links_pkey PRIMARY KEY (id),
  CONSTRAINT word_links_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);