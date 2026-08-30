import { PostList } from '../../components/PostList';

export default function DashboardPage() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Dashboard</h1>
        <div style={{ display: 'flex', gap: 16, fontSize: 14 }}>
          <a href="/posts/new">+ New post</a>
          <a href="/settings">Settings</a>
          <a href="/admin">Admin</a>
        </div>
      </div>
      <PostList />
    </main>
  );
}
