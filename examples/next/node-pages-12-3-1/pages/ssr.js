const EdgeSsrExample = ({ message }) => {
  return (
    <>
      <h1>Edge SSR Example</h1>

      <div>
        <h3>Server message = <span>{message}</span></h3>
      </div>
    </>
  )
}

export const getServerSideProps = async ({ req, res }) => {
  console.log("Running server side EdgeSsrExample!");

  const message = 7*6;

  return { props: { message } }
}

export default EdgeSsrExample