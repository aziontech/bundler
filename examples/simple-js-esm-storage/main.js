import Storage from 'azion:storage';

export default async function handleRequest(event) {
  const method = event.request.method;
  if (method !== 'GET' && method !== 'POST') {
    throw new Error(`Invalid method: ${method}. Expected GET or POST.`);
  }
  const key = decodeURI(new URL(event.request.url).pathname);
  const storage = new Storage('mybucketname');

  if (method === 'POST') {
    await storage.put(key, event.request.body, {
      metadata: { id: 1234 },
    });
    return new Response('ok');
  }

  const asset = await storage.get(key);
  console.log('metadata', asset?.metadata);
  console.log('contentType', asset?.contentType);
  console.log('contentLength', asset?.contentLength);

  return new Response(asset?.content);
}
