/* eslint-disable */
declare const AZION_VERSION_ID: string;

import getMessages from "./messages.js";

function getRandomMessage(messages: string[]): string {
  const randomIndex: number = Math.floor(Math.random() * messages.length);

  return messages[randomIndex];
}

const main = (event: any) => {
  const messages = getMessages();
  const message = getRandomMessage(messages);

  console.log("selected message:", message);
  console.log("VERSION_ID =", AZION_VERSION_ID);

  return new Response(message, {
    headers: new Headers([["X-Custom-Feat", "my random message"]]),
    status: 200,
  });
}

export default main;