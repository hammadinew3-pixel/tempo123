import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const typesPath = path.join(__dirname, '../src/integrations/supabase/types.ts');
let content = fs.readFileSync(typesPath, 'utf8');

// Liste des tables où tenant_id doit être optionnel dans Insert
const tables = [
  'vehicles', 'clients', 'contracts', 'assistance', 'assurances',
  'expenses', 'revenus', 'cheques', 'sinistres', 'infractions',
  'interventions', 'vehicules_traite', 'contract_payments',
  'secondary_drivers', 'vehicle_affectations', 'vehicle_changes',
  'vehicle_insurance', 'vehicle_technical_inspection', 'vehicle_vignette',
  'vehicules_traites_echeances', 'infraction_files', 'sinistre_files',
  'assurance_bareme', 'vehicle_assistance_categories', 'user_roles'
];

// Pour chaque table, rendre tenant_id optionnel dans Insert
tables.forEach(table => {
  // Pattern pour trouver Insert type avec tenant_id: string
  const pattern = new RegExp(
    `(${table}:\\s*{[^}]*Insert:\\s*{[^}]*tenant_id:)\\s*string`,
    'gs'
  );
  
  content = content.replace(pattern, '$1 string | null');
});

// Aussi rendre user_id optionnel dans user_roles Insert car géré par trigger
content = content.replace(
  /(user_roles:\s*{[^}]*Insert:\s*{[^}]*user_id:)\s*string/gs,
  '$1 string | null'
);

fs.writeFileSync(typesPath, content, 'utf8');
console.log('✅ Types Supabase ajustés : tenant_id et user_id rendus optionnels pour les INSERT');
