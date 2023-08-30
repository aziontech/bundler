import type { NextApiRequest, NextApiResponse } from 'next'

export const config = {
  runtime: "edge"
}

type Data = {
  name: string
}

export default function handler() {
  return new Response(
    JSON.stringify({ name: 'John Doe' }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
}
