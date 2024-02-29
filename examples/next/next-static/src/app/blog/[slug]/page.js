import styles from '../../page.module.css';
import Link from 'next/link';

export default function Page({ params }) {
  return (
    <main className={styles.main}>
      <div className={styles.center}>
        <div className={styles.description}>My Post slug: {params.slug}</div>
      </div>
      <div className={styles.card}>
        <Link href="/">go back</Link>
      </div>
    </main>
  )
}

export async function generateStaticParams() {
  const posts = [
    { slug: 'post-1' },
    { slug: 'post-2' },
    { slug: 'post-3' },
  ]

  return posts.map((post) => ({
    slug: post.slug,
  }))
}
