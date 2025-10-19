-- Function to check if tenant has Assistance module enabled
create or replace function public.tenant_has_module_assistance(_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(p.module_assistance, false)
  from public.tenants t
  left join public.plans p on p.id = t.plan_id
  where t.id = _tenant_id
$$;

-- ENFORCE module gating on Assistance-related tables

-- 1) Table: assurances
alter policy "Users can view their tenant assurances"
  on public.assurances
  using (
    (tenant_id = get_user_tenant_id(auth.uid()))
    and (tenant_is_active(auth.uid()) = true)
    and public.tenant_has_module_assistance(get_user_tenant_id(auth.uid()))
  );

alter policy "Agents can insert assurances in their tenant"
  on public.assurances
  with check (
    (tenant_id = get_user_tenant_id(auth.uid()))
    and (has_role(auth.uid(), 'agent'::app_role) or has_role(auth.uid(), 'admin'::app_role))
    and public.tenant_has_module_assistance(get_user_tenant_id(auth.uid()))
  );

alter policy "Agents can update assurances in their tenant"
  on public.assurances
  using (
    (tenant_id = get_user_tenant_id(auth.uid()))
    and (has_role(auth.uid(), 'agent'::app_role) or has_role(auth.uid(), 'admin'::app_role))
    and public.tenant_has_module_assistance(get_user_tenant_id(auth.uid()))
  )
  with check (
    (tenant_id = get_user_tenant_id(auth.uid()))
    and (has_role(auth.uid(), 'agent'::app_role) or has_role(auth.uid(), 'admin'::app_role))
    and public.tenant_has_module_assistance(get_user_tenant_id(auth.uid()))
  );

alter policy "Admins can delete assurances in their tenant"
  on public.assurances
  using (
    (tenant_id = get_user_tenant_id(auth.uid()))
    and has_role(auth.uid(), 'admin'::app_role)
    and public.tenant_has_module_assistance(get_user_tenant_id(auth.uid()))
  );

-- 2) Table: assurance_bareme
alter policy "Users can view their tenant assurance bareme"
  on public.assurance_bareme
  using (
    (tenant_id = get_user_tenant_id(auth.uid()))
    and (tenant_is_active(auth.uid()) = true)
    and public.tenant_has_module_assistance(get_user_tenant_id(auth.uid()))
  );

alter policy "Agents can insert assurance bareme in their tenant"
  on public.assurance_bareme
  with check (
    (tenant_id = get_user_tenant_id(auth.uid()))
    and (has_role(auth.uid(), 'agent'::app_role) or has_role(auth.uid(), 'admin'::app_role))
    and public.tenant_has_module_assistance(get_user_tenant_id(auth.uid()))
  );

alter policy "Agents can update assurance bareme in their tenant"
  on public.assurance_bareme
  using (
    (tenant_id = get_user_tenant_id(auth.uid()))
    and (has_role(auth.uid(), 'agent'::app_role) or has_role(auth.uid(), 'admin'::app_role))
    and public.tenant_has_module_assistance(get_user_tenant_id(auth.uid()))
  );

alter policy "Admins can delete assurance bareme in their tenant"
  on public.assurance_bareme
  using (
    (tenant_id = get_user_tenant_id(auth.uid()))
    and has_role(auth.uid(), 'admin'::app_role)
    and public.tenant_has_module_assistance(get_user_tenant_id(auth.uid()))
  );

-- 3) Table: assistance
alter policy "Users can view their tenant assistance"
  on public.assistance
  using (
    (tenant_id = get_user_tenant_id(auth.uid()))
    and (tenant_is_active(auth.uid()) = true)
    and public.tenant_has_module_assistance(get_user_tenant_id(auth.uid()))
  );

alter policy "Agents can insert assistance in their tenant"
  on public.assistance
  with check (
    (tenant_id = get_user_tenant_id(auth.uid()))
    and (tenant_is_active(auth.uid()) = true)
    and (has_role(auth.uid(), 'agent'::app_role) or has_role(auth.uid(), 'admin'::app_role))
    and public.tenant_has_module_assistance(get_user_tenant_id(auth.uid()))
  );

alter policy "Agents can update their tenant assistance"
  on public.assistance
  using (
    (tenant_id = get_user_tenant_id(auth.uid()))
    and (tenant_is_active(auth.uid()) = true)
    and (has_role(auth.uid(), 'agent'::app_role) or has_role(auth.uid(), 'admin'::app_role))
    and public.tenant_has_module_assistance(get_user_tenant_id(auth.uid()))
  )
  with check (
    (tenant_id = get_user_tenant_id(auth.uid()))
    and (tenant_is_active(auth.uid()) = true)
    and (has_role(auth.uid(), 'agent'::app_role) or has_role(auth.uid(), 'admin'::app_role))
    and public.tenant_has_module_assistance(get_user_tenant_id(auth.uid()))
  );

alter policy "Admins can delete their tenant assistance"
  on public.assistance
  using (
    (tenant_id = get_user_tenant_id(auth.uid()))
    and (tenant_is_active(auth.uid()) = true)
    and has_role(auth.uid(), 'admin'::app_role)
    and public.tenant_has_module_assistance(get_user_tenant_id(auth.uid()))
  );