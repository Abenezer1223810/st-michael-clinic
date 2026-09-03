const fs = require('fs');
const path = require('path');
const catalog = require('../src/data/michaelClinicLabCatalog.json');

const lines = [];
lines.push('-- ==========================================================================');
lines.push('-- MICHAEL MEDIUM CLINIC - LABORATORY MODULE SCHEMA & CATALOG SEEDER (ETB)');
lines.push('-- Document Ref: 4/08/017 - LABORATORY SERVICE PRICE');
lines.push('-- ==========================================================================\n');

lines.push('-- 1. Lab Categories Table');
lines.push('CREATE TABLE IF NOT EXISTS "lab_categories" (');
lines.push('  "id" VARCHAR(64) PRIMARY KEY,');
lines.push('  "slug" VARCHAR(64) UNIQUE NOT NULL,');
lines.push('  "name" VARCHAR(128) NOT NULL,');
lines.push('  "code" VARCHAR(32) NOT NULL,');
lines.push('  "description" TEXT,');
lines.push('  "display_order" INTEGER DEFAULT 0,');
lines.push('  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,');
lines.push('  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP');
lines.push(');\n');

lines.push('-- 2. Lab Tests Table');
lines.push('CREATE TABLE IF NOT EXISTS "lab_tests" (');
lines.push('  "id" VARCHAR(64) PRIMARY KEY,');
lines.push('  "code" VARCHAR(64) NOT NULL,');
lines.push('  "name" VARCHAR(128) NOT NULL,');
lines.push('  "full_name" VARCHAR(255),');
lines.push('  "category_id" VARCHAR(64),');
lines.push('  "group" VARCHAR(128) NOT NULL,');
lines.push('  "price" NUMERIC(10, 2) NOT NULL DEFAULT 0.00,');
lines.push('  "currency" VARCHAR(8) DEFAULT \'ETB\',');
lines.push('  "unit" VARCHAR(64),');
lines.push('  "reference_range" VARCHAR(255),');
lines.push('  "specimen_type" VARCHAR(128),');
lines.push('  "input_type" VARCHAR(32) DEFAULT \'number\',');
lines.push('  "is_quantitative" BOOLEAN DEFAULT TRUE,');
lines.push('  "is_panel" BOOLEAN DEFAULT FALSE,');
lines.push('  "bundle_key" VARCHAR(64),');
lines.push('  "bundle_note" TEXT,');
lines.push('  "options" JSONB DEFAULT \'[]\'::jsonb,');
lines.push('  "sub_parameters" JSONB DEFAULT \'[]\'::jsonb,');
lines.push('  "description" TEXT,');
lines.push('  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,');
lines.push('  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP');
lines.push(');\n');

lines.push('-- 3. Populate Categories');
for (const cat of catalog.categories) {
  lines.push('INSERT INTO "lab_categories" ("id", "slug", "name", "code", "description", "display_order")');
  lines.push(`VALUES ('${cat.id}', '${cat.slug}', '${cat.name.replace(/'/g, "''")}', '${cat.code}', '${(cat.description || '').replace(/'/g, "''")}', ${cat.displayOrder})`);
  lines.push('ON CONFLICT ("id") DO UPDATE SET');
  lines.push('  "name" = EXCLUDED."name",');
  lines.push('  "description" = EXCLUDED."description",');
  lines.push('  "display_order" = EXCLUDED."display_order";\n');
}

lines.push('-- 4. Populate Tests');
for (const t of catalog.tests) {
  const optionsJson = JSON.stringify(t.options || []).replace(/'/g, "''");
  const subParamsJson = JSON.stringify(t.subParameters || []).replace(/'/g, "''");
  const bundleKeyVal = t.bundleKey ? `'${t.bundleKey}'` : 'NULL';
  const bundleNoteVal = t.bundleNote ? `'${t.bundleNote.replace(/'/g, "''")}'` : 'NULL';
  const descVal = t.description ? `'${t.description.replace(/'/g, "''")}'` : 'NULL';

  lines.push('INSERT INTO "lab_tests" (');
  lines.push('  "id", "code", "name", "full_name", "category_id", "group",');
  lines.push('  "price", "currency", "unit", "reference_range", "specimen_type",');
  lines.push('  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",');
  lines.push('  "options", "sub_parameters", "description"');
  lines.push(') VALUES (');
  lines.push(`  '${t.id}', '${t.code}', '${t.name.replace(/'/g, "''")}', '${(t.fullName || t.name).replace(/'/g, "''")}', '${t.categoryId}', '${t.category.replace(/'/g, "''")}',`);
  lines.push(`  ${t.price}, '${t.currency || 'ETB'}', '${(t.unit || '').replace(/'/g, "''")}', '${(t.normalRange || '').replace(/'/g, "''")}', '${(t.specimenType || '').replace(/'/g, "''")}',`);
  lines.push(`  '${t.inputType || 'number'}', ${t.isQuantitative ? 'TRUE' : 'FALSE'}, ${t.isPanel ? 'TRUE' : 'FALSE'}, ${bundleKeyVal}, ${bundleNoteVal},`);
  lines.push(`  '${optionsJson}'::jsonb, '${subParamsJson}'::jsonb, ${descVal}`);
  lines.push(')');
  lines.push('ON CONFLICT ("id") DO UPDATE SET');
  lines.push('  "code" = EXCLUDED."code",');
  lines.push('  "name" = EXCLUDED."name",');
  lines.push('  "full_name" = EXCLUDED."full_name",');
  lines.push('  "group" = EXCLUDED."group",');
  lines.push('  "price" = EXCLUDED."price",');
  lines.push('  "unit" = EXCLUDED."unit",');
  lines.push('  "reference_range" = EXCLUDED."reference_range",');
  lines.push('  "specimen_type" = EXCLUDED."specimen_type",');
  lines.push('  "input_type" = EXCLUDED."input_type",');
  lines.push('  "is_quantitative" = EXCLUDED."is_quantitative",');
  lines.push('  "bundle_key" = EXCLUDED."bundle_key",');
  lines.push('  "options" = EXCLUDED."options",');
  lines.push('  "sub_parameters" = EXCLUDED."sub_parameters";\n');
}

fs.writeFileSync(path.resolve(__dirname, '../prisma/seed_lab_catalog.sql'), lines.join('\n'), 'utf-8');
console.log('SUCCESS: seed_lab_catalog.sql created with', lines.length, 'lines.');