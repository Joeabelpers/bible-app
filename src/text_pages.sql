-- ─── text_pages ──────────────────────────────────────────────────────────────
-- Typed counterpart to ink_pages. Same key shape (user_id + page_key) so the
-- local-first IndexedDB layer and the offline flush can treat both the same
-- way; page_key is namespaced "text:Book:Chapter:pN" so a typed page and an
-- ink page for the same chapter never collide.

create table if not exists public.text_pages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  page_key    text not null,
  book        text,
  chapter     integer,
  content     text not null default '',
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  unique (user_id, page_key)
);

alter table public.text_pages enable row level security;

-- Same policy shape as ink_pages: a row is only ever visible to its owner.
drop policy if exists "text_pages own rows select" on public.text_pages;
create policy "text_pages own rows select" on public.text_pages
  for select using (auth.uid() = user_id);

drop policy if exists "text_pages own rows insert" on public.text_pages;
create policy "text_pages own rows insert" on public.text_pages
  for insert with check (auth.uid() = user_id);

drop policy if exists "text_pages own rows update" on public.text_pages;
create policy "text_pages own rows update" on public.text_pages
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "text_pages own rows delete" on public.text_pages;
create policy "text_pages own rows delete" on public.text_pages
  for delete using (auth.uid() = user_id);

create index if not exists text_pages_user_book_idx
  on public.text_pages (user_id, book, chapter);
