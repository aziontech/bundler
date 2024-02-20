import Link from 'next/link'
import { useRouter } from 'next/router'

export default function LocaleSwitcher() {
  const router = useRouter()
  const { locales, locale: activeLocale } = router

  const otherLocales = (locales || []).filter(
    (locale) => locale !== activeLocale
  )

  return (
    <div className='my-10 bg-white p-4 rounded-lg shadow-md'>
      <p className='mt-5 text-gray-600'><b>Locale switcher:</b></p>
      <ul>
        {otherLocales.map((locale) => {
          const { pathname, query, asPath } = router
          return (
            <li key={locale}>
              <div className='mt-1 text-blue-500 hover:text-blue-800 hover:underline active:text-blue-800'>
                <Link
                  href={{ pathname, query }}
                  as={asPath}
                  locale={locale}
                  legacyBehavior
                >
                  {locale}
                </Link>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}