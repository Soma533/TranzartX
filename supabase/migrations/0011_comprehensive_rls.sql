-- 0011: comprehensive RLS for every user-written table (PRD trust §27).
-- Closes the deny-by-default traps (follows/connections had RLS on with no
-- write rules) and locks previously open tables to owner/party scope.
-- Service-role (webhooks, cron, admin review) bypasses RLS unaffected.

-- FOLLOWS: parties read; follower writes own rows.
alter table follows enable row level security;
drop policy if exists "parties read follows" on follows;
create policy "parties read follows" on follows for select using (
  exists (select 1 from profiles p where p.id in (follows.follower_id, follows.following_id) and p.user_id = auth.uid())
);
drop policy if exists "follower manages follows" on follows;
create policy "follower manages follows" on follows for all using (
  exists (select 1 from profiles p where p.id = follows.follower_id and p.user_id = auth.uid())
) with check (
  exists (select 1 from profiles p where p.id = follows.follower_id and p.user_id = auth.uid())
);

-- CONNECTIONS: parties read; requester inserts; receiver reviews.
alter table connections enable row level security;
drop policy if exists "parties read connections" on connections;
create policy "parties read connections" on connections for select using (
  exists (select 1 from profiles p where p.id in (connections.requester_id, connections.receiver_id) and p.user_id = auth.uid())
);
drop policy if exists "requester inserts connections" on connections;
create policy "requester inserts connections" on connections
  for insert with check (
    exists (select 1 from profiles p where p.id = connections.requester_id and p.user_id = auth.uid())
  );
drop policy if exists "receiver reviews connections" on connections;
create policy "receiver reviews connections" on connections
  for update using (
    exists (select 1 from profiles p where p.id = connections.receiver_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from profiles p where p.id = connections.receiver_id and p.user_id = auth.uid())
  );

-- CAREER GOALS: owners manage own.
alter table career_goals enable row level security;
drop policy if exists "owners manage goals" on career_goals;
create policy "owners manage goals" on career_goals for all using (
  exists (select 1 from profiles p where p.id = career_goals.profile_id and p.user_id = auth.uid())
) with check (
  exists (select 1 from profiles p where p.id = career_goals.profile_id and p.user_id = auth.uid())
);

-- ROADMAP ITEMS: owners manage items of own goals.
alter table roadmap_items enable row level security;
drop policy if exists "owners manage roadmap" on roadmap_items;
create policy "owners manage roadmap" on roadmap_items for all using (
  exists (
    select 1 from career_goals g join profiles p on p.id = g.profile_id
    where g.id = roadmap_items.goal_id and p.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from career_goals g join profiles p on p.id = g.profile_id
    where g.id = roadmap_items.goal_id and p.user_id = auth.uid()
  )
);

-- COLLECTIONS: public read (discovery), owners manage.
alter table collections enable row level security;
drop policy if exists "public read collections" on collections;
create policy "public read collections" on collections for select using (true);
drop policy if exists "owners manage collections" on collections;
create policy "owners manage collections" on collections for all using (
  exists (select 1 from profiles p where p.id = collections.artist_id and p.user_id = auth.uid())
) with check (
  exists (select 1 from profiles p where p.id = collections.artist_id and p.user_id = auth.uid())
);

-- INQUIRIES: parties read; sender inserts own.
alter table inquiries enable row level security;
drop policy if exists "parties read inquiries" on inquiries;
create policy "parties read inquiries" on inquiries for select using (
  exists (select 1 from profiles p where p.id in (inquiries.from_id, inquiries.to_artist_id) and p.user_id = auth.uid())
);
drop policy if exists "sender creates inquiries" on inquiries;
create policy "sender creates inquiries" on inquiries
  for insert with check (
    exists (select 1 from profiles p where p.id = inquiries.from_id and p.user_id = auth.uid())
  );

-- TRANSACTIONS: parties read; buyer inserts own. Webhook uses service role.
alter table transactions enable row level security;
drop policy if exists "parties read transactions" on transactions;
create policy "parties read transactions" on transactions for select using (
  exists (select 1 from profiles p where p.id in (transactions.buyer_id, transactions.artist_id) and p.user_id = auth.uid())
);
drop policy if exists "buyer creates transactions" on transactions;
create policy "buyer creates transactions" on transactions
  for insert with check (
    exists (select 1 from profiles p where p.id = transactions.buyer_id and p.user_id = auth.uid())
  );

-- NOTIFICATIONS: owners read own. All cross-user writes go through the
-- service-role client in API routes (no anon insert policy by design).
alter table notifications enable row level security;
drop policy if exists "owners read notifications" on notifications;
create policy "owners read notifications" on notifications for select using (user_id = auth.uid());
drop policy if exists "owners create own notifications" on notifications;
create policy "owners create own notifications" on notifications
  for insert with check (user_id = auth.uid());

-- ANALYTICS EVENTS: owners read own; any signed-in user may log events.
alter table analytics_events enable row level security;
drop policy if exists "owners read analytics" on analytics_events;
create policy "owners read analytics" on analytics_events for select using (
  exists (select 1 from profiles p where p.id = analytics_events.actor_id and p.user_id = auth.uid())
);
drop policy if exists "signed-in log analytics" on analytics_events;
create policy "signed-in log analytics" on analytics_events
  for insert with check (auth.uid() is not null);
