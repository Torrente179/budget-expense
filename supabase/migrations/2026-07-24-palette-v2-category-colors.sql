-- Palette v2 category colors (Jul 2026).
-- Updates known default category names (EN + common ES labels).
-- Does not overwrite unrelated custom categories.

update public.categories
set color = case lower(btrim(name))
  when 'housing' then '#6366F1'
  when 'vivienda' then '#6366F1'
  when 'tithe' then '#14B8A6'
  when 'tithe / diezmo' then '#14B8A6'
  when 'diezmo' then '#14B8A6'
  when 'donations' then '#14B8A6'
  when 'donaciones' then '#14B8A6'
  when 'food & dining' then '#F43F5E'
  when 'alimentacion y restaurantes' then '#F43F5E'
  when 'alimentación y restaurantes' then '#F43F5E'
  when 'restaurants' then '#F43F5E'
  when 'restaurantes' then '#F43F5E'
  when 'groceries' then '#22C55E'
  when 'supermercado' then '#22C55E'
  when 'travel' then '#06B6D4'
  when 'viajes' then '#06B6D4'
  when 'utilities' then '#84CC16'
  when 'servicios' then '#84CC16'
  when 'shopping' then '#8B5CF6'
  when 'compras' then '#8B5CF6'
  when 'healthcare' then '#EC4899'
  when 'health' then '#EC4899'
  when 'salud' then '#EC4899'
  when 'subscriptions' then '#F97316'
  when 'suscripciones' then '#F97316'
  when 'other' then '#64748B'
  when 'otros' then '#64748B'
  when 'salary' then '#059669'
  when 'nómina' then '#059669'
  when 'nomina' then '#059669'
  when 'other income' then '#059669'
  when 'otros ingresos' then '#059669'
  else color
end
where lower(btrim(name)) in (
  'housing', 'vivienda',
  'tithe', 'tithe / diezmo', 'diezmo', 'donations', 'donaciones',
  'food & dining', 'alimentacion y restaurantes', 'alimentación y restaurantes',
  'restaurants', 'restaurantes',
  'groceries', 'supermercado',
  'travel', 'viajes',
  'utilities', 'servicios',
  'shopping', 'compras',
  'healthcare', 'health', 'salud',
  'subscriptions', 'suscripciones',
  'other', 'otros',
  'salary', 'nómina', 'nomina',
  'other income', 'otros ingresos'
);
