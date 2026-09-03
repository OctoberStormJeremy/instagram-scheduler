import { requestJson } from './api';

export function refreshPostStatus(postId: string) {
  return requestJson<{
    status: string;
    publishedAt: string | null;
    lastError: string | null;
    updatedAt: string | null;
  }>(`/api/posts/${encodeURIComponent(postId)}/status`);
}
