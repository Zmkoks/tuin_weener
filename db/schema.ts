import { primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const zonePlants = sqliteTable(
  'zone_plants',
  {
    zoneId: text('zone_id').notNull(),
    plantSlug: text('plant_slug').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [primaryKey({ columns: [table.zoneId, table.plantSlug] })],
);
