-- Demo schema + seed for Supabase SQL Editor
-- Run this file in SQL Editor once.

create table if not exists base_items (
  id bigint generated always as identity primary key,
  part_name text,
  part_no text,
  child_name text,
  child_no text,
  tool_name text,
  tool_type text,
  vendor_tool_no text,
  customer_tool_no text,
  real_tool_no text,
  supplier text,
  tool_supplier text,
  parts_factory text,
  purchaser text,
  created_at timestamptz default now()
);

create table if not exists delivery_items (
  id bigint generated always as identity primary key,
  part_name text,
  part_no text,
  child_name text,
  child_no text,
  tool_name text,
  tool_type text,
  real_tool_no text,
  supplier text,
  created_at timestamptz default now()
);

create table if not exists accept_items (
  id bigint generated always as identity primary key,
  part_name text,
  part_no text,
  child_name text,
  child_no text,
  tool_name text,
  tool_type text,
  real_tool_no text,
  supplier text,
  ext jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists templates (
  id bigint generated always as identity primary key,
  name text not null,
  creator text,
  created_at text,
  items jsonb default '[]'::jsonb
);

create table if not exists projects (
  id bigint generated always as identity primary key,
  code text not null,
  owner text,
  updated_at text,
  progress_index int default 0,
  stages jsonb default '[]'::jsonb
);

alter table base_items enable row level security;
alter table delivery_items enable row level security;
alter table accept_items enable row level security;
alter table templates enable row level security;
alter table projects enable row level security;

drop policy if exists "base_items_select_all" on base_items;
drop policy if exists "base_items_insert_all" on base_items;
drop policy if exists "base_items_update_all" on base_items;
drop policy if exists "base_items_delete_all" on base_items;
create policy "base_items_select_all" on base_items for select to anon, authenticated using (true);
create policy "base_items_insert_all" on base_items for insert to anon, authenticated with check (true);
create policy "base_items_update_all" on base_items for update to anon, authenticated using (true) with check (true);
create policy "base_items_delete_all" on base_items for delete to anon, authenticated using (true);

drop policy if exists "delivery_items_select_all" on delivery_items;
drop policy if exists "delivery_items_insert_all" on delivery_items;
drop policy if exists "delivery_items_update_all" on delivery_items;
drop policy if exists "delivery_items_delete_all" on delivery_items;
create policy "delivery_items_select_all" on delivery_items for select to anon, authenticated using (true);
create policy "delivery_items_insert_all" on delivery_items for insert to anon, authenticated with check (true);
create policy "delivery_items_update_all" on delivery_items for update to anon, authenticated using (true) with check (true);
create policy "delivery_items_delete_all" on delivery_items for delete to anon, authenticated using (true);

drop policy if exists "accept_items_select_all" on accept_items;
drop policy if exists "accept_items_insert_all" on accept_items;
drop policy if exists "accept_items_update_all" on accept_items;
drop policy if exists "accept_items_delete_all" on accept_items;
create policy "accept_items_select_all" on accept_items for select to anon, authenticated using (true);
create policy "accept_items_insert_all" on accept_items for insert to anon, authenticated with check (true);
create policy "accept_items_update_all" on accept_items for update to anon, authenticated using (true) with check (true);
create policy "accept_items_delete_all" on accept_items for delete to anon, authenticated using (true);

drop policy if exists "templates_select_all" on templates;
drop policy if exists "templates_insert_all" on templates;
drop policy if exists "templates_update_all" on templates;
drop policy if exists "templates_delete_all" on templates;
create policy "templates_select_all" on templates for select to anon, authenticated using (true);
create policy "templates_insert_all" on templates for insert to anon, authenticated with check (true);
create policy "templates_update_all" on templates for update to anon, authenticated using (true) with check (true);
create policy "templates_delete_all" on templates for delete to anon, authenticated using (true);

drop policy if exists "projects_select_all" on projects;
drop policy if exists "projects_insert_all" on projects;
drop policy if exists "projects_update_all" on projects;
drop policy if exists "projects_delete_all" on projects;
create policy "projects_select_all" on projects for select to anon, authenticated using (true);
create policy "projects_insert_all" on projects for insert to anon, authenticated with check (true);
create policy "projects_update_all" on projects for update to anon, authenticated using (true) with check (true);
create policy "projects_delete_all" on projects for delete to anon, authenticated using (true);

-- Reset demo data
truncate table base_items, delivery_items, accept_items, templates, projects restart identity;

insert into base_items
(part_name, part_no, child_name, child_no, tool_name, tool_type, vendor_tool_no, customer_tool_no, real_tool_no, supplier, tool_supplier, parts_factory, purchaser)
values
('副驾驶座椅总成', '6608347607', '副驾驶安全带盖板1', '6608347607', '副驾驶安全带盖板检具A1', '注塑模具', 'GP1002012', 'GDZR201511026183', 'GDZR202508013085', '维诗恩塑胶有限公司', '宁波宝贝电子', '宁波继峰汽车零部件有限公司', '张三'),
('副驾驶座椅总成', '6608347608', '副驾驶安全带盖板2', '6608347608', '副驾驶安全带盖板检具A2', '注塑模具', 'GP1002013', 'GDZR201511026184', 'GDZR202508013086', '鸿瑞兴模具有限公司', '宁海良诚模具有限公司', '宁波继峰汽车零部件有限公司', '李新宇');

insert into delivery_items
(part_name, part_no, child_name, child_no, tool_name, tool_type, real_tool_no, supplier)
values
('仪表盘总成', '7709123001', '中控饰板', '7709123001', '中控饰板检具B1', '工装分类', 'REAL202500001', '维诗恩塑胶有限公司'),
('后排座椅总成', '8801234567', '后排扶手盖板', '8801234567', '扶手盖板检具C1', '工装分类', 'REAL202500002', '鸿瑞兴模具有限公司');

insert into accept_items
(part_name, part_no, child_name, child_no, tool_name, tool_type, real_tool_no, supplier, ext)
values
('副驾驶座椅总成', '6608347607', '副驾驶安全带盖板', '6608347607', '副驾驶安全带盖板检具A1', '其他模具', 'GZDR202508013085', '维诗恩塑胶有限公司', '{"length":"","width":"","height":"","weight":""}'),
('仪表盘总成', '7709123001', '中控饰板', '7709123001', '中控饰板检具B1', '注塑模具', 'REAL202500001', '鸿瑞兴模具有限公司', '{"length":"","width":"","height":"","weight":""}');

insert into templates (name, creator, created_at, items)
values
('吉利1', '张三', '2025.01.01', '[{"label":"验收报告","fileName":"无"},{"label":"材质证明","fileName":"无"}]'),
('理想1', '李四', '2025.01.01', '[{"label":"验收报告","fileName":"无"},{"label":"上模图片","fileName":"无"}]');

insert into projects (code, owner, updated_at, progress_index, stages)
values
('CM2E', '李新宇', '2024-01-12 12:22', 2, '[]'::jsonb),
('BWM', '张三', '2024-01-12 12:22', 1, '[]'::jsonb);

