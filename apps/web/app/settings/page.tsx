import { ConnectInstagramButton } from '../../components/ConnectInstagramButton';
import { DisconnectInstagramButton } from '../../components/DisconnectInstagramButton';

export default function SettingsPage() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: 32 }}>
      <h1>Settings</h1>
      <section style={{ marginTop: 24 }}>
        <h2>Instagram connection</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <ConnectInstagramButton />
          <DisconnectInstagramButton />
        </div>
      </section>
    </main>
  );
}
