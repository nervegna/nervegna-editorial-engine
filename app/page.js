import fs from 'fs';
import path from 'path';
import Link from 'next/link';

function getEditorials() {
  const dir = path.join(process.cwd(), 'content/editorials');
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .sort()
    .reverse();

  return files.map(filename => {
    const content = fs.readFileSync(path.join(dir, filename), 'utf8');
    const slug = filename.replace('.md', '');

    // Extract title from first # heading
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : 'Untitled';

    // Extract date from filename (editorial-YYYY-MM-DD-xxxxx.md)
    const dateMatch = filename.match(/editorial-(\d{4}-\d{2}-\d{2})/);
    const date = dateMatch ? dateMatch[1] : '';

    // Extract first paragraph as excerpt (skip the title line)
    const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));
    const excerpt = lines.slice(0, 2).join(' ').substring(0, 200);

    return { slug, title, date, excerpt };
  });
}

export default function Home() {
  const editorials = getEditorials();

  return (
    <main>
      {editorials.length === 0 ? (
        <p>No editorials yet. Run the engine to generate the first one.</p>
      ) : (
        <ul className="editorial-list">
          {editorials.map(ed => (
            <li key={ed.slug} className="editorial-card">
              <Link href={`/editorial/${ed.slug}`}>
                <span className="editorial-card-date">
                  {ed.date && new Date(ed.date + 'T00:00:00').toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                <h2 className="editorial-card-title">{ed.title}</h2>
                <p className="editorial-card-excerpt">{ed.excerpt}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
