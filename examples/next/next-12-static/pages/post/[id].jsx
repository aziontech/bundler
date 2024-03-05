import Link from 'next/link';
import Head from 'next/head';
import React, { useState } from 'react';
import { getPosts, getPostById } from "../../lib/posts";

function Example() {
  // Declare a new state variable, which we'll call "count"
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>追加したカウンターコンポーネントだよ</p>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>Click me</button>
    </div>
  );
}

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
    <main>
      <Head>
        <title>{title}</title>
      </Head>

      <h1>{title}</h1>

      <p>{body}</p>

      <Link href="/">
        <a>Go back to home</a>
      </Link>
      <Example />
    </main>
  );
}
