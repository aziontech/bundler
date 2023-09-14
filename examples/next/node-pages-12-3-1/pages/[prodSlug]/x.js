function Page({ prodSlug }) {

  return (
    <>
      <h1>Slug in /[prodSlug]/x route: {prodSlug}</h1>
    </>
  )
}

export const getStaticProps = async ({ params }) => {
  const prodSlug = params?.prodSlug ?? ''

  return {
    props: {
        prodSlug
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
