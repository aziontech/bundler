import "../app/globals.css"
import styles from "../app/page.module.css";
import Link from 'next/link'

export default function Other() {
  return (
    <main className={styles.main}>
      <div className={styles.center}>
        <div className={styles.description}>Other page</div>
      </div>
      <div className={styles.card}>
        <Link href="/">go back</Link>
      </div>
    </main>
  );
}
