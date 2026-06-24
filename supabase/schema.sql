create table if not exists public.lexipaper_entries (
  id text primary key,
  word text not null,
  part_of_speech text default '',
  meaning text default '',
  sentence text default '',
  paper_title text default '',
  page text default '',
  source text default '',
  tags text[] not null default '{}',
  note text default '',
  importance integer not null default 3 check (importance between 1 and 5),
  status text not null default 'new' check (status in ('new', 'review', 'mastered')),
  starred boolean not null default false,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  updated_at timestamptz not null default now(),
  raw_payload jsonb not null default '{}'::jsonb
);

create index if not exists lexipaper_entries_word_idx
  on public.lexipaper_entries (lower(word));

create index if not exists lexipaper_entries_created_at_idx
  on public.lexipaper_entries (created_at desc);

create index if not exists lexipaper_entries_status_idx
  on public.lexipaper_entries (status);

alter table public.lexipaper_entries enable row level security;
