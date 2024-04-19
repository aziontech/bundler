/* eslint-disable */
/**
 *
 * @param event
 */
export default async function main(event) {
  const key = 'MY_VAR';
  const value = Azion.env.get(key);
  if (!value) {
    return new Response('Environment variable not found', { status: 500 });
  }
  const response = `Hello Env Vars at ${value}!`;

  return new Response(response, { status: 200 });
}
