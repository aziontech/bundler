/**
 * Generate an array based on a range of numbers
 * @param {number} start - start number
 * @param {number} end - end number
 * @returns {number[]} - generated array
 */
function generateNumericArray(start, end) {
  const result = [];
  for (let index = start; index <= end; index++) {
    result.push(index);
  }
  return result;
}

// eslint-disable-next-line
export default async function (globalConfig, projectConfig) {
  // check docker-compose available ports
  // TODO: unify this range of numbers (get from docker-compose file)
  globalThis.dockerAvailablePorts = generateNumericArray(3000, 3040);
}
