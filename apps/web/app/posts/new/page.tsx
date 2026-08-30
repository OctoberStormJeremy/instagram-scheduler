import { CreatePostForm } from '../../components/CreatePostForm';

export default function NewPostPage() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: 32 }}>
      <h1>New post</h1>
      <CreatePostForm />
    </main>
  );
}
