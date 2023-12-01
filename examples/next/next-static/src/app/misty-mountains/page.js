import styles from "../page.module.css";
import Link from 'next/link'

export default function Gandalf() {
  return (
    <main className={styles.main}>
      <div className={styles.center}>
        <div className={styles.description}>Mountains!</div>
      </div>
      <div className={styles.card}>
        <Link href="/">go back</Link>
      </div>
    </main>
  );
}
