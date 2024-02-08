export const config = {
  runtime: "edge"
}

export default async function (req) {
  let requestHeaders = {}

  req.headers.forEach((value, name) => {
    requestHeaders[name] = value;
  })

  return new Response(
    JSON.stringify({ name: 'John Doe', requestHeaders }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
}