-- Activer la réplication complète pour capturer toutes les données lors des mises à jour
ALTER TABLE public.vehicles REPLICA IDENTITY FULL;
ALTER TABLE public.clients REPLICA IDENTITY FULL;
ALTER TABLE public.contracts REPLICA IDENTITY FULL;
ALTER TABLE public.assistance REPLICA IDENTITY FULL;
ALTER TABLE public.sinistres REPLICA IDENTITY FULL;
ALTER TABLE public.expenses REPLICA IDENTITY FULL;
ALTER TABLE public.invoices REPLICA IDENTITY FULL;
ALTER TABLE public.vehicle_insurance REPLICA IDENTITY FULL;
ALTER TABLE public.vehicle_technical_inspection REPLICA IDENTITY FULL;
ALTER TABLE public.vehicle_vignette REPLICA IDENTITY FULL;
ALTER TABLE public.vidanges REPLICA IDENTITY FULL;
ALTER TABLE public.assurances REPLICA IDENTITY FULL;
ALTER TABLE public.contract_payments REPLICA IDENTITY FULL;

-- Ajouter les tables à la publication realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contracts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.assistance;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sinistres;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_insurance;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_technical_inspection;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_vignette;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vidanges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.assurances;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contract_payments;