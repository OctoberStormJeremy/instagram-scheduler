import Link from 'next/link';

export default function DashboardPage() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: 32 }}>
      <h1>Dashboard</h1>
      <p>
        <Link href="/posts/new">Create a post</Link> · <Link href="/settings">Settings</Link> · <Link href="/admin">Admin</Link>
      </p>
    </main>
  );
}
