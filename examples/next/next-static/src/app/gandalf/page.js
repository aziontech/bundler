import styles from "../page.module.css";
import Link from 'next/link'

const name = 'Gandalf';
const description = 'the white';

export default function Gandalf() {
  return (
    <main className={styles.main}>
      <div className={styles.center}>
        <div className={styles.description}>{name}, {description}.</div>
      </div>
      <div className={styles.card}>
        <Link href="/">go back</Link>
      </div>
    </main>
  );
}
