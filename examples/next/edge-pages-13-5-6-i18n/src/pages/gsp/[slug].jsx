import Link from 'next/link';
import { useRouter } from 'next/router';
import LocaleSwitcher from '../../components/locale-switcher';

import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function GspPage(props) {
  const router = useRouter();
  const { defaultLocale, isFallback, query } = router;

  if (isFallback) {
    return 'Loading...';
  }

  return (
    <div className={`bg-white p-4 ${inter.className}`}>
      <div className='flex flex-col items-center justify-center'>
        <h2 className='text-5xl font-medium text-gray-900'>dynamic getStaticProps page</h2>
        <p className='mt-5 text-gray-600'><b>Current slug:</b> {query.slug}</p>
        <p className='mt-5 text-gray-600'><b>Current locale:</b> {props.locale}</p>
        <p className='mt-5 text-gray-600'><b>Default locale:</b> {defaultLocale}</p>
        <p className='mt-5 text-gray-600'><b>Configured locales:</b> {JSON.stringify(props.locales)}</p>

        <LocaleSwitcher />

        <div className='mt-5 text-blue-500 hover:text-blue-800 hover:underline active:text-blue-800'>
          <Link href="/gsp">Go to getStaticProps page</Link>
        </div>

        <div className='mt-5 text-blue-500 hover:text-blue-800 hover:underline active:text-blue-800'>
          <Link href="/gssp">Go to getServerSideProps page</Link>
        </div>

        <div className='mt-5 text-blue-500 hover:text-blue-800 hover:underline active:text-blue-800'>
          <Link href="/">Go to index page</Link>
        </div>
      </div>
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

export const runtime = 'experimental-edge';