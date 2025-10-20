-- Fonction RPC sécurisée pour créer une souscription
create or replace function public.create_subscription_for_current_tenant(
  _plan_id uuid,
  _duration int
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_start date := current_date;
  v_end date;
  v_sub_id uuid;
begin
  -- Récupère le tenant actif de l'utilisateur (échoue si null)
  v_tenant_id := public.get_user_tenant_id(auth.uid());
  if v_tenant_id is null then
    raise exception 'No active tenant for user';
  end if;

  -- Vérifie le rôle admin côté serveur
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'Not allowed: admin role required';
  end if;

  -- Calcule la date de fin
  v_end := (v_start + make_interval(months => _duration))::date;

  -- Insert sécurisé
  insert into public.subscriptions(
    tenant_id, plan_id, duration, start_date, end_date, is_active, status
  ) values (
    v_tenant_id, _plan_id, _duration, v_start, v_end, false, 'awaiting_payment'
  )
  returning id into v_sub_id;

  -- Met à jour le statut du tenant
  update public.tenants
  set status = 'pending_payment'
  where id = v_tenant_id;

  return v_sub_id;
end;
$$;

-- Autorise les utilisateurs authentifiés à appeler la fonction
grant execute on function public.create_subscription_for_current_tenant(uuid, int) to authenticated;