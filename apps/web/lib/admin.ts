import { requestJson } from './api';

export function reconcileScheduledPosts() {
  return requestJson<{ count?: number }>('/api/admin/reconcile-scheduled-posts', { method: 'POST' });
}
