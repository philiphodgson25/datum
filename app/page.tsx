import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>DA Statement</h1>
      <p>DB Test & Build</p>
      <ul>
        <li>
          <Link href="/new">Start a new statement</Link>
        </li>
        <li>
          <Link href="/runs">View recent runs</Link>
        </li>
      </ul>
    </main>
  );
}

