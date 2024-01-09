import Link from 'next/link';
import { useRouter } from 'next/router';
import LocaleSwitcher from '../../components/locale-switcher';

export default function GspPage(props) {
  const router = useRouter();
  const { defaultLocale, isFallback, query } = router;

  if (isFallback) {
    return 'Loading...';
  }

  return (
    <div>
      <h1>getStaticProps page</h1>
      <p>Current slug: {query.slug}</p>
      <p>Current locale: {props.locale}</p>
      <p>Default locale: {defaultLocale}</p>
      <p>Configured locales: {JSON.stringify(props.locales)}</p>

      <LocaleSwitcher />

      <Link href="/gsp">To getStaticProps page</Link>
      <br />

      <Link href="/gssp">To getServerSideProps page</Link>
      <br />

      <Link href="/">To index page</Link>
      <br />
    </div>
  );
}

export const getServerSideProps = async ({
  locale,
  locales,
}) => {
  return {
    props: {
      locale,
      locales,
    },
  };
};

// export const getStaticPaths: GetStaticPaths = ({ locales = [] }) => {
//   const paths = [];

//   for (const locale of locales) {
//     paths.push({ params: { slug: 'first' }, locale });
//     paths.push({ params: { slug: 'second' }, locale });
//   }

//   return {
//     paths,
//     fallback: true,
//   };
// };

export const runtime = 'experimental-edge';