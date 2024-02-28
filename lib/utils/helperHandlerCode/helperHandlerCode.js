/**
 * Check and change AddEventListener event
 * @param {string} eventTarget target event
 * @param {string} newEvent new event
 * @param {string} code code to be changed
 * @param {boolean} replaceCode code to replace
 * @returns {object} - Object with matchEvent and codeChanged
 */
const checkAndChangeAddEventListener = (
  eventTarget,
  newEvent,
  code,
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
