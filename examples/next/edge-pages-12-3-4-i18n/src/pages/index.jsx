import Link from 'next/link'
import { useRouter } from 'next/router'
import LocaleSwitcher from '../components/locale-switcher'

export default function IndexPage() {
  const router = useRouter()
  const { locale, locales, defaultLocale } = router


  return (
    <div className='bg-white p-4'>
      <div className='flex flex-col items-center justify-center'>
        <h2 className='text-5xl font-medium text-gray-900'>Index page</h2>
        <p className='mt-5 text-gray-600'><b>Current locale:</b> {locale}</p>
        <p className='mt-5 text-gray-600'><b>Default locale:</b> {defaultLocale}</p>
        <p className='mt-5 text-gray-600'><b>Configured locales:</b> {JSON.stringify(locales)}</p>

        <LocaleSwitcher />

        <div className='mt-5 text-blue-500 hover:text-blue-800 hover:underline active:text-blue-800'>
          <Link href="/gsp">Go to getStaticProps page</Link>
        </div>

        <div className='mt-5 text-blue-500 hover:text-blue-800 hover:underline active:text-blue-800'>
          <Link href="/gsp/first">Go to dynamic getStaticProps page</Link>
        </div>

        <div className='mt-5 text-blue-500 hover:text-blue-800 hover:underline active:text-blue-800'>
          <Link href="/gssp">Go to getServerSideProps page (get text from server)</Link>
        </div>
      </div>
    </div>
  )
}