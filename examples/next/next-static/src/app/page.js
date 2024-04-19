import Image from 'next/image'
import styles from './page.module.css'
import Link from 'next/link'

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.description}>
        <p>
          Get started by editing&nbsp;
          <code className={styles.code}>src/app/page.js</code>
        </p>
        <div>
          <a
            href="https://vercel.com?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            By{' '}
            <Image
              src="/vercel.svg"
              alt="Vercel Logo"
              className={styles.vercelLogo}
              width={100}
              height={24}
              priority
            />
          </a>
        </div>
      </div>

      <div className={styles.center}>
        <Image
          className={styles.logo}
          src="/next.svg"
          alt="Next.js Logo"
          width={180}
          height={37}
          priority
        />
      </div>

      <div className={styles.grid}>
        <a
          href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          className={styles.card}
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2>
            Docs <span>-&gt;</span>
          </h2>
          <p>Find in-depth information about Next.js features and API.</p>
        </a>

        <a
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          className={styles.card}
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2>
            Learn <span>-&gt;</span>
          </h2>
          <p>Learn about Next.js in an interactive course with&nbsp;quizzes!</p>
        </a>

        <a
          href="/blog/post-2/"
          className={styles.card}
          rel="noopener noreferrer"
        >
          <h2>
            blog post 2<span>-&gt;</span>
          </h2>
          <p>Dynamic route example using app format</p>
        </a>

        <Link
          href="/blog/post-2/"
          className={styles.card}
          rel="noopener noreferrer"
        >
          <h2>
            blog post 2 (Using Link)<span>-&gt;</span>
          </h2>
          <p>Dynamic route example using app format</p>
        </Link>

        <a
          href="/misty-mountains/moria"
          className={styles.card}
          rel="noopener noreferrer"
        >
          <h2>
            Mines of Moria<span>-&gt;</span>
          </h2>
          <p>
            The dark and treacherous labyrinth of the Misty Mountains.
            Example using app format.
          </p>
        </a>

        <Link
          href="/misty-mountains/moria"
          className={styles.card}
          rel="noopener noreferrer"
        >
          <h2>
            Mines of Moria (Using Link)<span>-&gt;</span>
          </h2>
          <p>
            The dark and treacherous labyrinth of the Misty Mountains.
            Example using app format.
          </p>
        </Link>

        <a
          href="/other"
          className={styles.card}
          rel="noopener noreferrer"
        >
          <h2>
            Other page<span>-&gt;</span>
          </h2>
          <p>Page using pages format</p>
        </a>

        <Link
          href="/other"
          className={styles.card}
          rel="noopener noreferrer"
        >
          <h2>
            Other page (Using Link)<span>-&gt;</span>
          </h2>
          <p>Page using pages format</p>
        </Link>

        <a
          href="/posts/4"
          className={styles.card}
          rel="noopener noreferrer"
        >
          <h2>
            Post 4<span>-&gt;</span>

          </h2>
          <p>Dynamic route example using pages format</p>
        </a>

        <Link
          href="/posts/4"
          className={styles.card}
          rel="noopener noreferrer"
        >
          <h2>
            Post 4 (Using Link)<span>-&gt;</span>
          </h2>
          <p>Dynamic route example using pages format</p>
        </Link>

        <a
          href="/gandalf"
          className={styles.card}
          rel="noopener noreferrer"
        >
          <h2>
            Gandalf<span>-&gt;</span>

          </h2>
          <p>Example using app format.</p>
        </a>

        <Link
          href="/gandalf"
          className={styles.card}
          rel="noopener noreferrer"
        >
          <h2>
            Gandalf (Using Link)<span>-&gt;</span>
          </h2>
          <p>Example using app format.</p>
        </Link>

        <a
          href="/misty-mountains"
          className={styles.card}
          rel="noopener noreferrer"
        >
          <h2>
            Mountain!<span>-&gt;</span>

          </h2>
          <p>Example using app format.</p>
        </a>

        <Link
          href="/misty-mountains"
          className={styles.card}
          rel="noopener noreferrer"
        >
          <h2>
            Mountain! (Using Link)<span>-&gt;</span>
          </h2>
          <p>Example using app format.</p>
        </Link>
      </div>
    </main>
  )
}
