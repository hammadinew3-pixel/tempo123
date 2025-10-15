-- Assign admin role to anouar@seacar.com
INSERT INTO public.user_roles (user_id, role) 
VALUES ('6cf91067-4ef5-4316-b571-be3da398a478', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;