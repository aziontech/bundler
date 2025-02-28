/**
 * Check and change AddEventListener event
 */
const checkAndChangeAddEventListener = (
  eventTarget: string,
  newEvent: string,
  code: string,
  replaceCode = true,
) => {
  let codeChanged = code;
  const eventRegex = new RegExp(
    `addEventListener\\((['"]?)${eventTarget}\\1,`,
    'g',
  );
  const matchEvent = !!code.match(eventRegex);
  if (matchEvent && replaceCode) {
    codeChanged = code.replace(eventRegex, `addEventListener("${newEvent}",`);
  }
  return { matchEvent, codeChanged };
};

const helperCheckCode = {
  checkAndChangeAddEventListener,
};

export default helperCheckCode;
