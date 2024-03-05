import Head from 'next/head'
import styles from '@/styles/Home.module.css'
import Post from '../components/post'
import { getPosts } from "../../lib/posts"

export async function getStaticProps() {
  // fetch list of posts
  const postList = await getPosts();

  return {
    props: {
      postList,
    },
  };
}

export default function IndexPage({ postList }) {
  return (
    <main>
      <Head>
        <title>Home page</title>
      </Head>

      <div className={styles.center}>
        <img
          className={styles.logo}
          src="/next.svg"
          alt="Next.js Logo"
          width="180"
          height="37"
          priority
        />
      </div>

      <h1>List of posts</h1>

      <section>
        {postList.map((post) => (
          <Post {...post} key={post.id} />
        ))}
      </section>
    </main>
  );
}
