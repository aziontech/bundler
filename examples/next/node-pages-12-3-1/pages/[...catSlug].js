function Page({ catSlug }) {

  return (
    <>
      <h1>Slug in /[...catSlug] route: {catSlug}</h1>
    </>
  )
}

export const getStaticProps = async ({ params }) => {
  const catSlug = params?.catSlug ?? ''

  return {
    props: {
      catSlug
    },
  }
}

export const getStaticPaths = async () => {
  return {
    paths: [],
    fallback: 'blocking',
  }
}

Page.displayName = 'Page'

export default Page
