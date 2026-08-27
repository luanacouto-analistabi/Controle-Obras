-- 0004_storage_policies.sql
-- RLS do bucket project-documents (storage.objects) — sem isso, o upload
-- do cronograma na edição de projeto falha mesmo com o bucket criado,
-- porque buckets privados negam tudo por padrão até existir uma policy.

create policy "project_documents_storage_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'project-documents');

create policy "project_documents_storage_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'project-documents'
    and current_user_role() in ('admin', 'gestor')
  );

create policy "project_documents_storage_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'project-documents'
    and current_user_role() = 'admin'
  );
