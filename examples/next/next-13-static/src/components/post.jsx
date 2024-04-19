import Link from 'next/link';
import React, { useState } from 'react';
import styles from './post.module.css'

export default function Post({ title, body, id }) {
  return (
    <article className={styles.post}>
      <h2>{title}</h2>
      <p>{body}</p>
      <br/>
      <Link href={`/post/${id}`}>
        <strong>Read more...</strong>
      </Link>
    </article>
  );
}
