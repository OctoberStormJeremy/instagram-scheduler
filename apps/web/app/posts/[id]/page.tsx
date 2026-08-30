import { PostStatusRefresh } from '../../../components/PostStatusRefresh';

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main style={{ fontFamily: 'system-ui', padding: 32 }}>
      <h1>Post detail</h1>
      <p>ID: {id}</p>
      <PostStatusRefresh postId={id} />
    </main>
  );
}
