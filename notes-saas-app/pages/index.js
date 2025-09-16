export default function Home() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Notes SaaS Application</h1>
      <p>Redirecting to login...</p>
      <script>
        {typeof window !== 'undefined' && window.location.replace('/login')}
      </script>
    </div>
  );
}
