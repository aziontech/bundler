/**
 * Generates a timestamp string in the format "YYYYMMDDHHmmss".
 * @function
 * @name generateTimestamp
 * @memberof Utils
 * @returns {string} The generated timestamp.
 * @example
 *
 * // Example usage:
 * const timestamp = generateTimestamp();
 * console.log(timestamp); // "20220623123456"
 */
function generateTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

export default generateTimestamp;
