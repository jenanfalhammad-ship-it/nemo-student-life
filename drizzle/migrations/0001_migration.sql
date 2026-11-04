
create policy "own course files read" on storage.objects for select to authenticated using (bucket_id = 'course-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own course files write" on storage.objects for insert to authenticated with check (bucket_id = 'course-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own course files delete" on storage.objects for delete to authenticated using (bucket_id = 'course-files' and (storage.foldername(name))[1] = auth.uid()::text);

-- Server-side pearl rules: pearls computed from verified duration, capped per day
create function public.compute_pearls() returns trigger language plpgsql security definer set search_path = public as $$
declare today_total int; earned int := 0;
begin
  new.actual_minutes := least(new.actual_minutes, greatest(1, ceil(extract(epoch from (new.ended_at - new.started_at))/60)::int));
  if new.completed and new.actual_minutes >= new.planned_minutes and new.planned_minutes >= 25 then
    earned := case when new.planned_minutes >= 50 then 25 else 10 end;
  end if;
  select coalesce(sum(pearls),0) into today_total from public.focus_sessions where user_id = new.user_id and started_at::date = new.started_at::date;
  new.pearls := greatest(0, least(earned, 150 - today_total));
  return new;
end; $$;
create trigger focus_pearls before insert on public.focus_sessions for each row execute function public.compute_pearls();
