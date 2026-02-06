create table public.student_answers (
  id uuid not null default gen_random_uuid (),
  attempt_module_id uuid not null,
  reference_id uuid not null,
  question_ref text not null,
  student_response text null,
  is_correct boolean null,
  marks_awarded double precision null default 0,
  created_at timestamp with time zone null default now(),
  constraint student_answers_pkey primary key (id),
  constraint unique_answer_per_module_attempt unique (attempt_module_id, reference_id, question_ref),
  constraint student_answers_attempt_module_id_fkey foreign KEY (attempt_module_id) references attempt_modules (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_answers_module on public.student_answers using btree (attempt_module_id) TABLESPACE pg_default;



create table public.modules (
  id uuid not null default gen_random_uuid (),
  paper_id uuid null,
  module_type text null,
  heading text null,
  subheading text null,
  instruction text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  center_id uuid not null,
  view_option public.module_view_enum not null default 'private'::module_view_enum,
  constraint modules_pkey primary key (id),
  constraint modules_center_id_fkey foreign KEY (center_id) references centers (center_id),
  constraint modules_module_type_check check (
    (
      module_type = any (
        array[
          'reading'::text,
          'listening'::text,
          'writing'::text,
          'speaking'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_modules_paper_id on public.modules using btree (paper_id) TABLESPACE pg_default;


create table public.attempt_modules (
  id uuid not null default gen_random_uuid (),
  attempt_id uuid not null,
  module_id uuid not null,
  status text not null default 'pending'::text,
  started_at timestamp with time zone null,
  completed_at timestamp with time zone null,
  time_spent_seconds integer null default 0,
  score_obtained double precision null default 0,
  band_score numeric(3, 1) null,
  feedback text null,
  created_at timestamp with time zone null default now(),
  time_remaining_seconds integer null default 0,
  module_type text null,
  constraint attempt_modules_pkey primary key (id),
  constraint unique_module_per_attempt unique (attempt_id, module_id),
  constraint attempt_modules_attempt_id_fkey foreign KEY (attempt_id) references mock_attempts (id) on delete CASCADE,
  constraint attempt_modules_module_id_fkey foreign KEY (module_id) references modules (id) on delete CASCADE,
  constraint attempt_modules_status_check check (
    (
      status = any (
        array[
          'locked'::text,
          'pending'::text,
          'in_progress'::text,
          'completed'::text,
          'timeout'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create trigger trg_set_module_type BEFORE INSERT
or
update on attempt_modules for EACH row
execute FUNCTION set_attempt_module_type ();


create table public.centers (
  center_id uuid not null default gen_random_uuid (),
  name text not null,
  slug text not null,
  subscription_tier text null default 'basic'::text,
  is_active boolean null default true,
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp without time zone null default CURRENT_TIMESTAMP,
  user_id uuid null default auth.uid (),
  constraint centers_pkey primary key (center_id),
  constraint centers_slug_key unique (slug),
  constraint centers_user_id_fkey foreign KEY (user_id) references users (user_id)
) TABLESPACE pg_default;

create trigger update_centers_updated_at BEFORE
update on centers for EACH row
execute FUNCTION update_updated_at_column ();

