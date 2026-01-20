-- Create scheduled_tests table
create table if not exists public.scheduled_tests (
  id uuid not null default gen_random_uuid (),
  center_id uuid not null,
  paper_id uuid not null,
  title text not null,
  scheduled_at timestamp with time zone not null,
  duration_minutes integer null default 180,
  status text not null default 'scheduled',
  created_by uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint scheduled_tests_pkey primary key (id),
  constraint scheduled_tests_center_id_fkey foreign key (center_id) references centers (center_id) on delete cascade,
  constraint scheduled_tests_paper_id_fkey foreign key (paper_id) references papers (id) on delete cascade,
  constraint scheduled_tests_status_check check (
    status = any (
      array[
        'scheduled'::text,
        'in_progress'::text,
        'completed'::text,
        'cancelled'::text
      ]
    )
  )
) tablespace pg_default;

create index if not exists idx_scheduled_tests_center_id on public.scheduled_tests using btree (center_id) tablespace pg_default;
create index if not exists idx_scheduled_tests_paper_id on public.scheduled_tests using btree (paper_id) tablespace pg_default;
create index if not exists idx_scheduled_tests_status on public.scheduled_tests using btree (status) tablespace pg_default;
create index if not exists idx_scheduled_tests_scheduled_at on public.scheduled_tests using btree (scheduled_at) tablespace pg_default;


