export default function DashboardPage() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: 32 }}>
      <h1>Dashboard</h1>
      <p>
        <a href="/posts/new">Create a post</a> · <a href="/settings">Settings</a> · <a href="/admin">Admin</a>
      </p>
    </main>
  );
}
