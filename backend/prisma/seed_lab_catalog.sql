-- ==========================================================================
-- MICHAEL MEDIUM CLINIC - LABORATORY MODULE SCHEMA & CATALOG SEEDER (ETB)
-- Document Ref: 4/08/017 - LABORATORY SERVICE PRICE
-- ==========================================================================

-- 1. Lab Categories Table
CREATE TABLE IF NOT EXISTS "lab_categories" (
  "id" VARCHAR(64) PRIMARY KEY,
  "slug" VARCHAR(64) UNIQUE NOT NULL,
  "name" VARCHAR(128) NOT NULL,
  "code" VARCHAR(32) NOT NULL,
  "description" TEXT,
  "display_order" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Lab Tests Table
CREATE TABLE IF NOT EXISTS "lab_tests" (
  "id" VARCHAR(64) PRIMARY KEY,
  "code" VARCHAR(64) NOT NULL,
  "name" VARCHAR(128) NOT NULL,
  "full_name" VARCHAR(255),
  "category_id" VARCHAR(64),
  "group" VARCHAR(128) NOT NULL,
  "price" NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  "currency" VARCHAR(8) DEFAULT 'ETB',
  "unit" VARCHAR(64),
  "reference_range" VARCHAR(255),
  "specimen_type" VARCHAR(128),
  "input_type" VARCHAR(32) DEFAULT 'number',
  "is_quantitative" BOOLEAN DEFAULT TRUE,
  "is_panel" BOOLEAN DEFAULT FALSE,
  "bundle_key" VARCHAR(64),
  "bundle_note" TEXT,
  "options" JSONB DEFAULT '[]'::jsonb,
  "sub_parameters" JSONB DEFAULT '[]'::jsonb,
  "description" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Populate Categories
INSERT INTO "lab_categories" ("id", "slug", "name", "code", "description", "display_order")
VALUES ('CAT-HEM', 'hematology', 'Hematology', 'HEM', 'Complete blood counts, differential leukocytes, erythrocyte sedimentation and morphology', 1)
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "display_order" = EXCLUDED."display_order";

INSERT INTO "lab_categories" ("id", "slug", "name", "code", "description", "display_order")
VALUES ('CAT-URI', 'urinalysis-microscopy', 'Urinalysis & Microscopy', 'URI', 'Macroscopic physical, chemical dipstick and sediment microscopic examination', 2)
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "display_order" = EXCLUDED."display_order";

INSERT INTO "lab_categories" ("id", "slug", "name", "code", "description", "display_order")
VALUES ('CAT-STL', 'stool-test', 'Stool Test', 'STL', 'Direct wet mount parasitology, consistency and occult blood detection', 3)
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "display_order" = EXCLUDED."display_order";

INSERT INTO "lab_categories" ("id", "slug", "name", "code", "description", "display_order")
VALUES ('CAT-CHM', 'chemistry', 'Chemistry', 'CHM', 'Clinical biochemistry, renal function, liver enzymes, lipids, electrolytes and endocrine hormones', 4)
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "display_order" = EXCLUDED."display_order";

INSERT INTO "lab_categories" ("id", "slug", "name", "code", "description", "display_order")
VALUES ('CAT-SER', 'serology', 'Serology', 'SER', 'Immunology, infectious disease rapid diagnostics, febrile agglutination and microbiology', 5)
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "display_order" = EXCLUDED."display_order";

-- 4. Populate Tests
INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-HEM-01', 'CBC', 'CBC', 'Complete Blood Count (CBC)', 'CAT-HEM', 'Hematology',
  700, 'ETB', 'x10^3/µL', '4.0 – 11.0', 'Whole Blood (EDTA Purple Top)',
  'number', TRUE, TRUE, NULL, NULL,
  '[]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-HEM-02', 'DIFF', 'Diff', 'Differential Leukocyte Count (%L, %M, %E, %B, Diff N)', 'CAT-HEM', 'Hematology',
  0, 'ETB', '%', 'See Sub-Parameters', 'Whole Blood (EDTA Purple Top)',
  'sub_parameters', TRUE, FALSE, NULL, NULL,
  '[]'::jsonb, '[{"code":"DIFF_N","name":"Diff N","label":"Neutrophils","unit":"%","normalRange":"50 – 70","inputType":"number"},{"code":"DIFF_L","name":"%L","label":"Lymphocytes","unit":"%","normalRange":"20 – 40","inputType":"number"},{"code":"DIFF_M","name":"%M","label":"Monocytes","unit":"%","normalRange":"2 – 8","inputType":"number"},{"code":"DIFF_E","name":"%E","label":"Eosinophils","unit":"%","normalRange":"1 – 4","inputType":"number"},{"code":"DIFF_B","name":"%B","label":"Basophils","unit":"%","normalRange":"0 – 1","inputType":"number"}]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-HEM-03', 'HGB', 'Hgb', 'Hemoglobin (Hgb)', 'CAT-HEM', 'Hematology',
  150, 'ETB', 'g/dl', '12.0 – 16.0', 'Whole Blood (EDTA Purple Top)',
  'number', TRUE, FALSE, NULL, NULL,
  '[]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-HEM-04', 'HCT', 'Hct', 'Hematocrit (Hct)', 'CAT-HEM', 'Hematology',
  150, 'ETB', '%', '36 – 50', 'Whole Blood (EDTA Purple Top)',
  'number', TRUE, FALSE, NULL, NULL,
  '[]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-HEM-05', 'ESR', 'ESR', 'Erythrocyte Sedimentation Rate (ESR)', 'CAT-HEM', 'Hematology',
  300, 'ETB', 'mm/hr', '0 – 20', 'Sodium Citrate (Black Top)',
  'number', TRUE, FALSE, NULL, NULL,
  '[]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-HEM-06', 'RBC_MORPHOLOGY', 'RBC Morphology', 'Red Blood Cell Morphology', 'CAT-HEM', 'Hematology',
  150, 'ETB', 'Observation', 'Normocytic, Normochromic', 'Peripheral Blood Smear',
  'text', FALSE, FALSE, NULL, NULL,
  '[]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-HEM-07', 'BLOOD_GROUP', 'BLOOD GROUP', 'ABO & Rh Blood Group (BLOOD GRUP)', 'CAT-HEM', 'Hematology',
  300, 'ETB', 'Group', 'ABO/Rh', 'Whole Blood (EDTA)',
  'select', FALSE, FALSE, NULL, NULL,
  '["A+","A-","B+","B-","AB+","AB-","O+","O-"]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-HEM-08', 'BLOOD_FILM', 'BLOOD FILM', 'Peripheral Blood Film', 'CAT-HEM', 'Hematology',
  200, 'ETB', 'Observation', 'No hemoparasite seen', 'Blood Smear',
  'text', FALSE, FALSE, NULL, NULL,
  '[]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-URI-01', 'URINE_ANALYSIS', 'URINE ANALYSIS (General)', 'Urine Analysis & Microscopy (General)', 'CAT-URI', 'Urinalysis & Microscopy',
  400, 'ETB', 'Panel', 'See Sub-Parameters', 'Clean Catch Midstream Urine',
  'sub_parameters', FALSE, TRUE, NULL, NULL,
  '[]'::jsonb, '[{"code":"URI_COLOUR","name":"Colour","label":"Colour","unit":"Observation","normalRange":"Yellow / Straw","inputType":"select","options":["Straw","Yellow","Amber","Reddish","Dark Brown"]},{"code":"URI_APPEARANCE","name":"Appearance","label":"Appearance","unit":"Clarity","normalRange":"Clear","inputType":"select","options":["Clear","Slightly Turbid","Turbid","Hazy"]},{"code":"URI_PH","name":"PH","label":"pH","unit":"pH","normalRange":"5.0 – 8.0","inputType":"number"},{"code":"URI_SG","name":"SG","label":"Specific Gravity","unit":"SG","normalRange":"1.005 – 1.030","inputType":"number"},{"code":"URI_LEKU","name":"Leku","label":"Leukocytes (Leku)","unit":"Dipstick","normalRange":"Negative","inputType":"select","options":["Negative","Trace","1+","2+","3+"]},{"code":"URI_NITRITE","name":"Nitrite","label":"Nitrite","unit":"Dipstick","normalRange":"Negative","inputType":"select","options":["Negative","Positive"]},{"code":"URI_PROTEIN","name":"Protein","label":"Protein","unit":"Dipstick","normalRange":"Negative","inputType":"select","options":["Negative","Trace","1+","2+","3+","4+"]},{"code":"URI_SUGAR","name":"Sugar","label":"Sugar","unit":"Dipstick","normalRange":"Negative","inputType":"select","options":["Negative","Trace","1+","2+","3+","4+"]},{"code":"URI_KETONE","name":"Ketone","label":"Ketone","unit":"Dipstick","normalRange":"Negative","inputType":"select","options":["Negative","Trace","1+","2+","3+"]},{"code":"URI_BILIRUBIN","name":"Bilirubin","label":"Bilirubin","unit":"Dipstick","normalRange":"Negative","inputType":"select","options":["Negative","1+","2+","3+"]},{"code":"URI_UROBILINOGEN","name":"Urobilinogen","label":"Urobilinogen","unit":"mg/dl","normalRange":"< 1.0","inputType":"text"},{"code":"URI_BLOOD","name":"Blood","label":"Occult Blood","unit":"Dipstick","normalRange":"Negative","inputType":"select","options":["Negative","Trace","1+","2+","3+"]},{"code":"URI_EPIT_CELLS","name":"Epit. Cells","label":"Epithelial Cells","unit":"/HPF","normalRange":"0 – 5","inputType":"text"},{"code":"URI_WBC","name":"WBC","label":"Microscopy: WBC (Pus Cells)","unit":"/HPF","normalRange":"0 – 5","inputType":"text"},{"code":"URI_RBC","name":"RBC","label":"Microscopy: RBC","unit":"/HPF","normalRange":"0 – 2","inputType":"text"},{"code":"URI_CASTS","name":"Casts","label":"Microscopy: Casts","unit":"/LPF","normalRange":"Nil","inputType":"text"}]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-STL-01', 'STOOL_EXAMINATION', 'Stool Examination', 'Stool Examination (Microscopy & Consistency)', 'CAT-STL', 'Stool Test',
  150, 'ETB', 'Microscopy', 'No ova or parasites seen', 'Stool Container',
  'sub_parameters', FALSE, FALSE, NULL, NULL,
  '[]'::jsonb, '[{"code":"STL_CONSISTENCY","name":"Consistency","label":"Consistency","unit":"Physical","normalRange":"Formed","inputType":"select","options":["Formed","Semi-Formed","Loose","Watery","Mucoid"]},{"code":"STL_COLOUR","name":"Colour","label":"Colour","unit":"Physical","normalRange":"Brown","inputType":"select","options":["Brown","Yellowish","Greenish","Clay","Black / Tarry"]},{"code":"STL_TROPHOZOITES","name":"Trophozoites","label":"Trophozoites","unit":"Microscopy","normalRange":"None seen","inputType":"text"},{"code":"STL_CYSTS","name":"Cysts","label":"Cysts","unit":"Microscopy","normalRange":"None seen","inputType":"text"},{"code":"STL_OVA","name":"Ova","label":"Ova / Parasites","unit":"Microscopy","normalRange":"No ova seen","inputType":"text"},{"code":"STL_PUS","name":"Pus Cells","label":"Pus Cells / WBC","unit":"/HPF","normalRange":"0 – 2","inputType":"text"},{"code":"STL_RBC","name":"RBC","label":"RBC","unit":"/HPF","normalRange":"Nil","inputType":"text"}]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-STL-02', 'COCULT_BLOOD', 'COCULT BLOOD', 'Stool Occult Blood (COCULT BLOOD)', 'CAT-STL', 'Stool Test',
  200, 'ETB', 'Qualitative', 'Negative', 'Stool Container',
  'select', FALSE, FALSE, NULL, NULL,
  '["Negative","Positive (+)"]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-CHM-01', 'FBS_RBS', 'FBS / RBS', 'Fasting / Random Blood Sugar (FBS / RBS)', 'CAT-CHM', 'Chemistry',
  50, 'ETB', 'mg/dl', '70 – 120', 'Fluoride Plasma / Serum',
  'number', TRUE, FALSE, NULL, NULL,
  '[]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-CHM-02', 'SGOT', 'SGOT', 'Serum Glutamic Oxaloacetic Transaminase (SGOT)', 'CAT-CHM', 'Chemistry',
  600, 'ETB', 'iu/L', '0 – 40', 'Serum (Yellow Top)',
  'number', TRUE, FALSE, 'SGOT_SGPT_BUNDLE', NULL,
  '[]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-CHM-03', 'SGPT', 'SGPT', 'Serum Glutamic Pyruvic Transaminase (SGPT)', 'CAT-CHM', 'Chemistry',
  600, 'ETB', 'iu/L', '0 – 40', 'Serum (Yellow Top)',
  'number', TRUE, FALSE, 'SGOT_SGPT_BUNDLE', NULL,
  '[]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-CHM-04', 'ALK_PHOS', 'Alk. Phos', 'Alkaline Phosphatase (Alk. Phos)', 'CAT-CHM', 'Chemistry',
  300, 'ETB', 'iu/L', '70 – 400', 'Serum (Yellow Top)',
  'number', TRUE, FALSE, NULL, NULL,
  '[]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-CHM-05', 'BILIRUBIN_T', 'Bilirubin (T)', 'Total Bilirubin (T)', 'CAT-CHM', 'Chemistry',
  150, 'ETB', 'mg/dl', '0.4 – 1.5', 'Serum (Yellow Top)',
  'number', TRUE, FALSE, NULL, NULL,
  '[]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-CHM-06', 'BILIRUBIN_D', 'Bilirubin (D)', 'Direct Bilirubin (D)', 'CAT-CHM', 'Chemistry',
  150, 'ETB', 'mg/dl', '0.0 – 0.2', 'Serum (Yellow Top)',
  'number', TRUE, FALSE, NULL, NULL,
  '[]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-CHM-07', 'UREA', 'Urea', 'Blood Urea', 'CAT-CHM', 'Chemistry',
  300, 'ETB', 'mg/dl', '10 – 40', 'Serum (Yellow Top)',
  'number', TRUE, FALSE, 'RFT_PANEL', NULL,
  '[]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-CHM-08', 'CREATININE', 'Creatinine', 'Serum Creatinine', 'CAT-CHM', 'Chemistry',
  300, 'ETB', 'mg/dl', '0.5 – 1.3', 'Serum (Yellow Top)',
  'number', TRUE, FALSE, 'RFT_PANEL', NULL,
  '[]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-CHM-09', 'URIC_ACID', 'Uric Acid', 'Serum Uric Acid', 'CAT-CHM', 'Chemistry',
  300, 'ETB', 'mg/dl', '3.2 – 6.8', 'Serum (Yellow Top)',
  'number', TRUE, FALSE, 'RFT_PANEL', NULL,
  '[]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-CHM-10', 'T_PROTEINS', 'T. Proteins', 'Total Serum Proteins (T. Proteins)', 'CAT-CHM', 'Chemistry',
  200, 'ETB', 'mg/dl', '6.6 – 8.7', 'Serum (Yellow Top)',
  'number', TRUE, FALSE, NULL, NULL,
  '[]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-CHM-11', 'TRIGLYCERIDS', 'Triglycerids', 'Serum Triglycerides (Triglycerids)', 'CAT-CHM', 'Chemistry',
  300, 'ETB', 'mg/dl', '<150', 'Serum (Yellow Top)',
  'number', TRUE, FALSE, 'LIPID_PROFILE', NULL,
  '[]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-CHM-12', 'CHOLESTEROL', 'Cholesterol', 'Total Cholesterol', 'CAT-CHM', 'Chemistry',
  300, 'ETB', 'mg/dl', '<200', 'Serum (Yellow Top)',
  'number', TRUE, FALSE, 'LIPID_PROFILE', NULL,
  '[]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-CHM-13', 'HDL_C', 'HDL-C', 'High-Density Lipoprotein (HDL-C)', 'CAT-CHM', 'Chemistry',
  300, 'ETB', 'mg/dl', '>60', 'Serum (Yellow Top)',
  'number', TRUE, FALSE, 'LIPID_PROFILE', NULL,
  '[]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-CHM-14', 'LDL_C', 'LDL-C', 'Low-Density Lipoprotein (LDL-C)', 'CAT-CHM', 'Chemistry',
  300, 'ETB', 'mg/dl', '<110', 'Serum (Yellow Top)',
  'number', TRUE, FALSE, 'LIPID_PROFILE', NULL,
  '[]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-CHM-15', 'SODIUM', 'Sodium', 'Serum Sodium (Na+)', 'CAT-CHM', 'Chemistry',
  200, 'ETB', 'mmol/L', '135 – 148', 'Serum (Yellow Top)',
  'number', TRUE, FALSE, NULL, NULL,
  '[]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-CHM-16', 'POTASSIUM', 'Potassium', 'Serum Potassium (K+)', 'CAT-CHM', 'Chemistry',
  200, 'ETB', 'mmol/L', '3.5 – 4.5', 'Serum (Yellow Top)',
  'number', TRUE, FALSE, NULL, NULL,
  '[]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-CHM-17', 'CHOLRIDE', 'Cholride', 'Serum Chloride (Cholride / Cl-)', 'CAT-CHM', 'Chemistry',
  200, 'ETB', 'mmol/L', '102 – 110', 'Serum (Yellow Top)',
  'number', TRUE, FALSE, NULL, NULL,
  '[]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-CHM-18', 'CD4', 'CD4', 'CD4 Helper T-Cell Count', 'CAT-CHM', 'Chemistry',
  500, 'ETB', '/mm³', '460 – 1600', 'Whole Blood (EDTA)',
  'number', TRUE, FALSE, NULL, NULL,
  '[]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-CHM-19', 'CD8', 'CD8', 'CD8 Cytotoxic T-Cell Count', 'CAT-CHM', 'Chemistry',
  500, 'ETB', '/mm³', '150 – 1000', 'Whole Blood (EDTA)',
  'number', TRUE, FALSE, NULL, NULL,
  '[]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-CHM-20', 'T3', 'T3', 'Triiodothyronine (T3)', 'CAT-CHM', 'Chemistry',
  590, 'ETB', 'Pg/ml', '2.3 – 4.2', 'Serum (Yellow Top)',
  'number', TRUE, FALSE, 'THYROID_PANEL', NULL,
  '[]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-CHM-21', 'T4', 'T4', 'Thyroxine (T4)', 'CAT-CHM', 'Chemistry',
  590, 'ETB', 'ng/dl', '4.6 – 12', 'Serum (Yellow Top)',
  'number', TRUE, FALSE, 'THYROID_PANEL', NULL,
  '[]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-CHM-22', 'TSH', 'TSH', 'Thyroid Stimulating Hormone (TSH)', 'CAT-CHM', 'Chemistry',
  590, 'ETB', 'mlu/L', '0.4 – 4.0', 'Serum (Yellow Top)',
  'number', TRUE, FALSE, 'THYROID_PANEL', NULL,
  '[]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-CHM-23', 'HBA1C', 'HbA1C', 'Glycated Hemoglobin (HbA1C)', 'CAT-CHM', 'Chemistry',
  750, 'ETB', '%', '4.0 – 5.6', 'Whole Blood (EDTA)',
  'number', TRUE, FALSE, NULL, NULL,
  '[]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-CHM-24', 'VIT_D', 'VIT D', 'Vitamin D (VIT D / 25-OH)', 'CAT-CHM', 'Chemistry',
  1100, 'ETB', 'ng/ml', '30 – 100', 'Serum (Yellow Top)',
  'number', TRUE, FALSE, NULL, NULL,
  '[]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-SER-01', 'VDRL', 'VDRL', 'VDRL Syphilis Screen', 'CAT-SER', 'Serology',
  300, 'ETB', 'Qualitative', 'Non-Reactive', 'Serum (Yellow Top)',
  'select', FALSE, FALSE, NULL, NULL,
  '["Non-Reactive","Reactive"]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-SER-02', 'WIDAL_H', 'Widal H', 'Widal H (Flagellar Antigen)', 'CAT-SER', 'Serology',
  150, 'ETB', 'Titer', '< 1:80', 'Serum (Yellow Top)',
  'select', FALSE, FALSE, NULL, NULL,
  '["Negative","1:20","1:40","1:80","1:160","1:320"]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-SER-03', 'WIDAL_O', 'Widal O', 'Widal O (Somatic Antigen)', 'CAT-SER', 'Serology',
  150, 'ETB', 'Titer', '< 1:80', 'Serum (Yellow Top)',
  'select', FALSE, FALSE, NULL, NULL,
  '["Negative","1:20","1:40","1:80","1:160","1:320"]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-SER-04', 'WEIL_FELIX', 'Weil felix', 'Weil-Felix Test (Weil felix)', 'CAT-SER', 'Serology',
  500, 'ETB', 'Titer', '< 1:80', 'Serum (Yellow Top)',
  'select', FALSE, FALSE, NULL, NULL,
  '["Negative","1:40","1:80","1:160","1:320"]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-SER-05', 'H_PYLORI_AB', 'H.Pylori Ab', 'H.Pylori Antibody (H.Pylori Ab)', 'CAT-SER', 'Serology',
  400, 'ETB', 'Qualitative', 'Negative', 'Serum / Whole Blood',
  'select', FALSE, FALSE, NULL, NULL,
  '["Negative","Positive (+)"]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-SER-06', 'H_PYLORI_AG', 'H.Pylori Ag', 'H.Pylori Stool Antigen (H.PYLORY Ag)', 'CAT-SER', 'Serology',
  700, 'ETB', 'Qualitative', 'Negative', 'Stool Container',
  'select', FALSE, FALSE, NULL, NULL,
  '["Negative","Positive (+)"]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-SER-07', 'RF', 'RF', 'Rheumatoid Factor (RF)', 'CAT-SER', 'Serology',
  250, 'ETB', 'Qualitative', 'Negative (< 8 IU/ml)', 'Serum (Yellow Top)',
  'select', FALSE, FALSE, NULL, NULL,
  '["Negative","Positive (+)"]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-SER-08', 'HIV_1_2', 'HIV 1-2', 'HIV 1-2 Rapid Screen', 'CAT-SER', 'Serology',
  150, 'ETB', 'Qualitative', 'Non-Reactive', 'Whole Blood / Serum',
  'select', FALSE, FALSE, NULL, NULL,
  '["Non-Reactive","Reactive"]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-SER-09', 'HBSAG', 'HBSAg', 'Hepatitis B Surface Antigen (HBSAg / HBS)', 'CAT-SER', 'Serology',
  300, 'ETB', 'Qualitative', 'Negative / Non-Reactive', 'Serum (Yellow Top)',
  'select', FALSE, FALSE, NULL, NULL,
  '["Negative","Positive (+)"]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-SER-10', 'HCV_AB', 'HCV Ab', 'Hepatitis C Virus Antibody (HCV Ab / HCV)', 'CAT-SER', 'Serology',
  300, 'ETB', 'Qualitative', 'Negative / Non-Reactive', 'Serum (Yellow Top)',
  'select', FALSE, FALSE, NULL, NULL,
  '["Negative","Positive (+)"]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-SER-11', 'CRP', 'CRP', 'C-Reactive Protein (CRP)', 'CAT-SER', 'Serology',
  400, 'ETB', 'mg/L', 'Negative (< 6 mg/L)', 'Serum (Yellow Top)',
  'select', FALSE, FALSE, 'ASO_CRP_BUNDLE', NULL,
  '["Negative","Positive (+)"]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-SER-12', 'ASO', 'ASO', 'Anti-Streptolysin O (ASO)', 'CAT-SER', 'Serology',
  400, 'ETB', 'IU/ml', 'Negative (< 200 IU/ml)', 'Serum (Yellow Top)',
  'select', FALSE, FALSE, 'ASO_CRP_BUNDLE', NULL,
  '["Negative","Positive (+)"]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-SER-13', 'PSA', 'PSA', 'Prostate-Specific Antigen (PSA)', 'CAT-SER', 'Serology',
  500, 'ETB', 'ng/ml', '< 4.0', 'Serum (Yellow Top)',
  'number', TRUE, FALSE, NULL, NULL,
  '[]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-SER-14', 'BACTERILOGY_SAMPLE', 'Bacterilogy sample', 'Bacteriology Sample (Bacterilogy sample)', 'CAT-SER', 'Serology',
  300, 'ETB', 'Observation', 'Sterile', 'Swab / Exudate',
  'text', FALSE, FALSE, NULL, NULL,
  '[]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-SER-15', 'KOH', 'KOH', 'KOH Preparation (KOH)', 'CAT-SER', 'Serology',
  600, 'ETB', 'Observation', 'No fungal elements seen', 'Skin / Hair / Nail Scraping',
  'text', FALSE, FALSE, NULL, NULL,
  '[]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-SER-16', 'GRAM_STAIN', 'Gram Stain', 'Gram Stain Smear', 'CAT-SER', 'Serology',
  250, 'ETB', 'Observation', 'No organism seen', 'Clinical Smear',
  'text', FALSE, FALSE, NULL, NULL,
  '[]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-SER-17', 'WET_FILM_WWF', 'Wet Film (WWF)', 'Wet Film / Vaginal Wet Mount (WWF)', 'CAT-SER', 'Serology',
  700, 'ETB', 'Observation', 'No Trichomonas / clue cells / yeast', 'Swab',
  'text', FALSE, FALSE, NULL, NULL,
  '[]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-SER-18', 'AFB', 'AFB', 'Acid-Fast Bacilli (AFB)', 'CAT-SER', 'Serology',
  200, 'ETB', 'Observation', 'Negative / No AFB seen', 'Sputum',
  'text', FALSE, FALSE, NULL, NULL,
  '[]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-SER-19', 'CULTURE', 'Culture', 'Culture & Sensitivity (Culture)', 'CAT-SER', 'Serology',
  600, 'ETB', 'Report', 'No growth', 'Swab / Fluid / Urine',
  'text', FALSE, FALSE, NULL, NULL,
  '[]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-SER-20', 'HCG_URINE', 'HCG (Urine)', 'Urine HCG Pregnancy Test', 'CAT-SER', 'Serology',
  50, 'ETB', 'Qualitative', 'Negative', 'Urine',
  'select', FALSE, FALSE, 'HCG_COMBO', NULL,
  '["Negative","Positive (+)"]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";

INSERT INTO "lab_tests" (
  "id", "code", "name", "full_name", "category_id", "group",
  "price", "currency", "unit", "reference_range", "specimen_type",
  "input_type", "is_quantitative", "is_panel", "bundle_key", "bundle_note",
  "options", "sub_parameters", "description"
) VALUES (
  'LT-SER-21', 'HCG_SERUM', 'HCG (Serum)', 'Serum HCG Pregnancy Test', 'CAT-SER', 'Serology',
  200, 'ETB', 'Qualitative', 'Negative', 'Serum (Yellow Top)',
  'select', FALSE, FALSE, 'HCG_COMBO', NULL,
  '["Negative","Positive (+)"]'::jsonb, '[]'::jsonb, NULL
)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "full_name" = EXCLUDED."full_name",
  "group" = EXCLUDED."group",
  "price" = EXCLUDED."price",
  "unit" = EXCLUDED."unit",
  "reference_range" = EXCLUDED."reference_range",
  "specimen_type" = EXCLUDED."specimen_type",
  "input_type" = EXCLUDED."input_type",
  "is_quantitative" = EXCLUDED."is_quantitative",
  "bundle_key" = EXCLUDED."bundle_key",
  "options" = EXCLUDED."options",
  "sub_parameters" = EXCLUDED."sub_parameters";
