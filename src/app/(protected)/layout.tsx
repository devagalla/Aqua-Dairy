import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { WorkspaceShell } from '@/components/workspace/workspace-shell'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = supabaseServer();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    redirect('/auth/signin');
  }
  return <WorkspaceShell email={data.user.email ?? ''}>{children}</WorkspaceShell>;
}
