const EdgeSsrExample = ({ message }) => {
  return (
    <>
      <h1>Edge SSR Example</h1>

      <div>
        <h3>Server message = {message}</h3>
      </div>
    </>
  )
}

export const getServerSideProps = async ({ req, res }) => {
  console.log("Running server side EdgeSsrExample!");

  const message = `Current Time : ${new Date()}`;

  return { props: { message } }
}

export default EdgeSsrExample