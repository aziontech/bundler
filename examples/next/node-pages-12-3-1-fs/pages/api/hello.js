/* eslint-disable */

// Next.js Edge API Routes: https://nextjs.org/docs/api-routes/edge-api-routes

import { readFileSync } from 'fs';

export default async function (req, res) {
  const data = JSON.parse(readFileSync('data/subDir/data.json', { encoding: 'utf-8' }));
  const message = readFileSync('data/message.txt', { encoding: 'utf-8' });

  res.status(200).json({ data, message });
}
