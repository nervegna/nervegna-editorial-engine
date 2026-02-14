import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import Link from 'next/link';

function getEditorial(slug) {
  const filepath = path.join(process.cwd(), 'content/editorials', `${slug}.md`);
  if (!fs.existsSync(filepath)) return null;

  const content = fs.readFileSync(filepath, 'utf8');

  // Extract title from first # heading
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : 'Untitled';

  // Extract date from filename
  const dateMatch = slug.match(/editorial-(\d{4}-\d{2}-\d{2})/);
  const date = dateMatch ? dateMatch[1] : '';

  // Remove the title line from body content to avoid duplication
  const body = content.replace(/^#\s+.+$/m, '').trim();
  const html = marked.parse(body);

  return { title, date, html };
}

function getAllSlugs() {
  const dir = path.join(process.cwd(), 'content/editorials');
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace('.md', ''));
}

export async function generateStaticParams() {
  return getAllSlugs().map(slug => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const editorial = getEditorial(slug);
  return {
    title: editorial ? `${editorial.title} — Nervegna` : 'Not Found',
  };
}

export default async function EditorialPage({ params }) {
  const { slug } = await params;
  const editorial = getEditorial(slug);

  if (!editorial) {
    return (
      <main>
        <h1>Editorial not found</h1>
        <Link href="/" className="back-link">Back to archive</Link>
      </main>
    );
  }

  return (
    <main>
      <article>
        <div className="editorial-header">
          <span className="editorial-date">
            {editorial.date && new Date(editorial.date + 'T00:00:00').toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
          <h1 className="editorial-title">{editorial.title}</h1>
        </div>
        <div
          className="editorial-body"
          dangerouslySetInnerHTML={{ __html: editorial.html }}
        />
      </article>
      <Link href="/" className="back-link">Back to archive</Link>
    </main>
  );
}
