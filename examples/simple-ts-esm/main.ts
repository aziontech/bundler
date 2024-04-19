import getMessages from "./messages.js";

function getRandomMessage(messages: string[]): string {
  const randomIndex: number = Math.floor(Math.random() * messages.length);

  return messages[randomIndex];
}

const main = (event: any) => {
  const messages: string[] = getMessages();
  const message: string = getRandomMessage(messages);
  const data: string = `Generated message: ${message}`;

  console.log("selected message:", message);

  return new Response(data, {
    headers: new Headers([["X-Custom-Feat", "my random message"]]),
    status: 200,
  });
}

export default main;