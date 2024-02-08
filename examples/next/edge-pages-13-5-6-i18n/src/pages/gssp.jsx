import Link from 'next/link';
import { useRouter } from 'next/router';
import LocaleSwitcher from '../components/locale-switcher';
import arData from '../lang/ar';
import enData from '../lang/en';
import frData from '../lang/fr';

import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function GsspPage(props) {
  const router = useRouter();
  const { defaultLocale } = router;

  return (
    <div className={`bg-white p-4 ${inter.className}`}>
      <div className='flex flex-col items-center justify-center'>
        <h2 className='text-5xl font-medium text-gray-900'>getServerSideProps page</h2>
        <p className='mt-5 text-gray-600'><b>Current locale:</b> {props.locale}</p>
        <p className='mt-5 text-gray-600'><b>Default locale:</b> {defaultLocale}</p>
        <p className='mt-5 text-gray-600'><b>Configured locales:</b> {JSON.stringify(props.locales)}</p>

        <LocaleSwitcher />

        <div className='mt-5'>
          <h3 className='text-3xl font-medium text-gray-900'>{props.data.title}</h3>
          <p className='mt-5 text-gray-600'>{props.data.description}</p>
        </div>

        <div className='mt-10 text-blue-500 hover:text-blue-800 hover:underline active:text-blue-800'>
          <Link href="/gsp">Go to getStaticProps page</Link>
        </div>

        <div className='mt-5 text-blue-500 hover:text-blue-800 hover:underline active:text-blue-800'>
          <Link href="/gsp/first">Go to dynamic getStaticProps page</Link>
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
  let data = {};
  switch (locale) {
    case 'ar':
      data = arData;
      break;
    case 'fr':
      data = frData;
      break;
    default:
      data = enData;
      break;
  }

  return {
    props: {
      locale,
      locales,
      data,
    },
  };
};

export const runtime = 'experimental-edge';