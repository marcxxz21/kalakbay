alter table public.ll_app_users
add column if not exists preferred_modes text[] not null default array['Mixed']::text[];

update public.ll_app_users
set preferred_modes = array[preferred_mode]
where preferred_modes is null
   or array_length(preferred_modes, 1) is null
   or (preferred_modes = array['Mixed']::text[] and preferred_mode <> 'Mixed');

alter table public.ll_app_users
drop constraint if exists ll_app_users_preferred_modes_check;

alter table public.ll_app_users
add constraint ll_app_users_preferred_modes_check
check (
  preferred_modes <@ array['Walking','Jeepney','Bus','Train','Bike','Car','Mixed']::text[]
  and array_length(preferred_modes, 1) >= 1
);
