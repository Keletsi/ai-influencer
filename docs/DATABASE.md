# Database Schema Documentation

This document describes the database structure for Motion Studio Pro.

## Overview

Motion Studio Pro uses **PostgreSQL** via Supabase with the following tables:

- `auth.users` - Managed by Supabase Auth
- `public.generations` - Video generation history
- `public.user_settings` - User preferences and settings

## Tables

### `auth.users` (Managed by Supabase)

This table is automatically managed by Supabase Auth and stores user account information.

**Key Fields:**
- `id` (uuid) - Unique user identifier
- `email` (text) - User email address
- `created_at` (timestamp) - Account creation time
- `last_sign_in_at` (timestamp) - Last login time

### `public.generations`

Stores all video generation requests and results.

**Schema:**

```sql
create table public.generations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  
  -- Input files
  reference_image_url text not null,
  motion_video_url text not null,
  
  -- Output
  result_video_url text,
  
  -- Status tracking
  status generation_status not null default 'pending',
  kling_task_id text not null,
  progress integer default 0,
  error_message text,
  
  -- Generation settings (stored as JSONB for flexibility)
  settings jsonb not null default '{}'::jsonb,
  
  -- Metadata
  credits_used numeric(10, 2),
  duration integer,
  
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

**Fields:**

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | uuid | No | Primary key |
| `user_id` | uuid | No | Foreign key to auth.users |
| `reference_image_url` | text | No | URL of uploaded reference image |
| `motion_video_url` | text | No | URL of uploaded motion video |
| `result_video_url` | text | Yes | URL of generated video (null until complete) |
| `status` | enum | No | One of: pending, processing, completed, failed |
| `kling_task_id` | text | No | Kling AI task identifier |
| `progress` | integer | Yes | Progress percentage (0-100) |
| `error_message` | text | Yes | Error details if failed |
| `settings` | jsonb | No | Generation settings object |
| `credits_used` | numeric | Yes | Kling AI credits consumed |
| `duration` | integer | Yes | Video duration in seconds |
| `created_at` | timestamp | No | When generation was created |
| `updated_at` | timestamp | No | Last update time |

**Settings JSONB Structure:**

```json
{
  "motionStrength": 65,
  "matchMode": "structure",
  "quality": "720p",
  "aspectRatio": "9:16",
  "negativePrompt": ""
}
```

**Indexes:**

```sql
create index generations_user_id_idx on public.generations(user_id);
create index generations_status_idx on public.generations(status);
create index generations_created_at_idx on public.generations(created_at desc);
create index generations_kling_task_id_idx on public.generations(kling_task_id);
```

### `public.user_settings`

Stores user preferences and optional API keys.

**Schema:**

```sql
create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  
  -- Default generation settings
  default_settings jsonb default '{
    "motionStrength": 65,
    "matchMode": "structure",
    "quality": "720p",
    "aspectRatio": "9:16",
    "negativePrompt": ""
  }'::jsonb,
  
  -- UI preferences
  theme text default 'dark',
  
  -- Optional: Store user's own Kling API keys
  kling_access_key text,
  kling_secret_key text,
  
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

**Fields:**

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `user_id` | uuid | No | Primary key, foreign key to auth.users |
| `default_settings` | jsonb | No | Default generation preferences |
| `theme` | text | Yes | UI theme preference (dark/light) |
| `kling_access_key` | text | Yes | Optional user-specific Kling access key |
| `kling_secret_key` | text | Yes | Optional user-specific Kling secret key |
| `created_at` | timestamp | No | When settings were created |
| `updated_at` | timestamp | No | Last update time |

## Row Level Security (RLS)

All tables have Row Level Security enabled to ensure users can only access their own data.

### Generations Table Policies

```sql
-- Users can view their own generations
create policy "Users can view their own generations"
  on public.generations
  for select
  using (auth.uid() = user_id);

-- Users can create their own generations
create policy "Users can create their own generations"
  on public.generations
  for insert
  with check (auth.uid() = user_id);

-- Users can update their own generations
create policy "Users can update their own generations"
  on public.generations
  for update
  using (auth.uid() = user_id);

-- Users can delete their own generations
create policy "Users can delete their own generations"
  on public.generations
  for delete
  using (auth.uid() = user_id);
```

### User Settings Table Policies

```sql
-- Users can view their own settings
create policy "Users can view their own settings"
  on public.user_settings
  for select
  using (auth.uid() = user_id);

-- Users can insert their own settings
create policy "Users can create their own settings"
  on public.user_settings
  for insert
  with check (auth.uid() = user_id);

-- Users can update their own settings
create policy "Users can update their own settings"
  on public.user_settings
  for update
  using (auth.uid() = user_id);
```

## Automatic Triggers

### Updated At Trigger

Automatically updates the `updated_at` timestamp when a row is modified:

```sql
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger handle_generations_updated_at
  before update on public.generations
  for each row
  execute function public.handle_updated_at();

create trigger handle_user_settings_updated_at
  before update on public.user_settings
  for each row
  execute function public.handle_updated_at();
```

### New User Trigger

Automatically creates user settings when a new user signs up:

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_settings (user_id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
```

## Storage Buckets

### `uploads` Bucket

Stores user-uploaded reference images and motion videos.

**Configuration:**
- Public: Yes
- File size limit: 100MB
- Allowed types: Images (PNG, JPG, JPEG), Videos (MP4, MOV, WebM)

**Folder Structure:**
```
uploads/
  ├── {user_id}/
  │   ├── {timestamp}-{random}.jpg
  │   ├── {timestamp}-{random}.mp4
  │   └── ...
```

### `results` Bucket

Can store generated videos locally (optional, Kling AI hosts results by default).

**Configuration:**
- Public: Yes
- File size limit: 500MB

## Queries

### Common Queries

**Get user's recent generations:**
```sql
select * from public.generations
where user_id = auth.uid()
order by created_at desc
limit 10;
```

**Get completed generations:**
```sql
select * from public.generations
where user_id = auth.uid()
  and status = 'completed'
order by created_at desc;
```

**Count generations by status:**
```sql
select status, count(*) 
from public.generations
where user_id = auth.uid()
group by status;
```

**Get user settings:**
```sql
select * from public.user_settings
where user_id = auth.uid();
```

## Backup and Restore

### Backup

Supabase automatically backs up your database daily. To create a manual backup:

1. Go to your Supabase project dashboard
2. Navigate to **Database** > **Backups**
3. Click "Create backup"

### Restore

To restore from a backup:

1. Go to **Database** > **Backups**
2. Select the backup you want to restore
3. Click "Restore"

### Export Data

To export all data:

```sql
-- Export generations
copy (
  select * from public.generations
  where user_id = 'your-user-id'
) to '/tmp/generations.csv' with csv header;

-- Export user settings
copy (
  select * from public.user_settings
  where user_id = 'your-user-id'
) to '/tmp/user_settings.csv' with csv header;
```

## Migrations

All database migrations are stored in `/supabase/migrations/`.

To apply migrations:

1. **Via Supabase Dashboard:**
   - Go to SQL Editor
   - Copy migration file contents
   - Execute

2. **Via Supabase CLI:**
```bash
supabase db push
```

## Performance Considerations

- **Indexes**: Critical indexes are already created on `user_id`, `status`, and `created_at`
- **JSONB**: Settings are stored as JSONB for flexibility; use GIN indexes if querying nested fields frequently
- **Cleanup**: Consider archiving or deleting old generations periodically
- **Storage**: Monitor storage usage; implement file cleanup for old uploads

## Security Best Practices

1. **Never disable RLS** - Always keep Row Level Security enabled
2. **Use anon key** - Never expose the service role key in frontend code
3. **Validate uploads** - Check file types and sizes before upload
4. **Encrypt sensitive data** - Consider using Supabase Vault for API keys
5. **Regular audits** - Review policies and user access regularly
