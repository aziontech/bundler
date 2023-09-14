// Next.js Edge API Routes: https://nextjs.org/docs/api-routes/edge-api-routes

export default async function (req, res) {
  res.status(200).json({ name: 'John Doe' })
}