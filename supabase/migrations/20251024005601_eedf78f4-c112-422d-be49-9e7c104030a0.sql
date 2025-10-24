-- Corriger les URLs des contrats existants dans infraction_files
UPDATE infraction_files
SET file_url = '/contract-template?id=' || split_part(file_url, '/contrat/', 2)
WHERE file_type = 'contrat' AND file_url LIKE '/contrat/%';