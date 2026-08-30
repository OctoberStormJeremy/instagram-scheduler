import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = true;

  if (!isAdmin) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
