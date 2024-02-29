import "../../app/globals.css"
import styles from "../../app/page.module.css";

import Link from 'next/link';

const POSTS = [
  {
    "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto",
    "id": 1,
    "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
    "userId": 1
  },
  {
      "body": "est rerum tempore vitae\nsequi sint nihil reprehenderit dolor beatae ea dolores neque\nfugiat blanditiis voluptate porro vel nihil molestiae ut reiciendis\nqui aperiam non debitis possimus qui neque nisi nulla",
      "id": 2,
      "title": "qui est esse",
      "userId": 1
  },
  {
      "body": "et iusto sed quo iure\nvoluptatem occaecati omnis eligendi aut ad\nvoluptatem doloribus vel accusantium quis pariatur\nmolestiae porro eius odio et labore et velit aut",
      "id": 3,
      "title": "ea molestias quasi exercitationem repellat qui ipsa sit aut",
      "userId": 1
  },
  {
      "body": "ullam et saepe reiciendis voluptatem adipisci\nsit amet autem assumenda provident rerum culpa\nquis hic commodi nesciunt rem tenetur doloremque ipsam iure\nquis sunt voluptatem rerum illo velit",
      "id": 4,
      "title": "eum et est occaecati",
      "userId": 1
  },
]

export default function Page({ id, title, body, userId  }) {
  return (
    <main className={styles.main}>
      <div className={styles.center}>
        <h1>Title: {title}</h1>
      </div>
      <div className={styles.center}>
        <div className={styles.description}>post id: {id}</div>
        <p className={styles.description}>{body}</p>
      </div>
      <div className={styles.card}>
        <Link href="/">go back</Link>
      </div>
    </main>
  )
}

export async function getStaticPaths() {
  const postsList = POSTS.map((post) => post.id);

  return {
    paths: postsList.map((id) => {
      return {
        params: {
          id: `${id}`,
        },
      };
    }),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const post = POSTS.filter((post) => post.id === parseInt(params.id))[0];

  return {
    props: post,
  };
}
