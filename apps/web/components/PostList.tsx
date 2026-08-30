'use client';

import { useEffect, useState } from 'react';
import type { ScheduledPost, PostStatus } from '../lib/types';

const STATUS_COLORS: Record<PostStatus, string> = {
  draft: '#888',
  scheduled: '#0070f3',
  processing: '#e6a817',
  published: '#0a7d4b',
  failed: 'crimson',
  canceled: '#888'
};

export function PostList() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch('/api/posts', { credentials: 'include' });
        const body = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(body?.error ?? 'Failed to load posts');
        }

        setPosts(body.posts ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load posts');
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  if (loading) {
    return <p>Loading posts…</p>;
  }

  if (error) {
    return <p style={{ color: 'crimson' }}>{error}</p>;
  }

  if (posts.length === 0) {
    return (
      <p style={{ color: '#555' }}>
        No posts yet. <a href="/posts/new">Create your first post →</a>
      </p>
    );
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 12 }}>
      {posts.map((post) => (
        <li
          key={post.id}
          style={{
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: '0 0 4px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {post.caption}
            </p>
            <p style={{ margin: 0, fontSize: 13, color: '#555' }}>
              {new Date(post.scheduledFor).toLocaleString()} · {post.timezone}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: STATUS_COLORS[post.status] ?? '#888',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              {post.status}
            </span>
            <a href={`/posts/${post.id}`} style={{ fontSize: 13 }}>
              View →
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
}
