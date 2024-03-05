import Link from 'next/link';
import Head from 'next/head';
import React from 'react';
import styles from '../../components/post.module.css'
import { getPosts, getPostById } from "../../../lib/posts"

export async function getStaticPaths() {
  const postList = await getPosts();

  return {
    paths: postList.map((post) => {
      return {
        params: {
          id: `${post.id}`,
        },
      };
    }),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  // fetch single post detail
  const post = await getPostById(params.id);

  return {
    props: post,
  };
}

export default function Post({ title, body }) {
  return (
    <main className={styles.post}>
      <Head>
        <title>{title}</title>
      </Head>

      <h1>{title}</h1>

      <p>{body}</p>

      <br/>
      <Link href="/">
        <strong>Go back to home</strong>
      </Link>
    </main>
  );
}
