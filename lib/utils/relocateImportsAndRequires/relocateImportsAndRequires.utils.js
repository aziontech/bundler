/**
 * Move requires and imports to file init while preserving comments.
 * @param {string} entryContent - The file content to be fixed.
 * @returns {string} The fixed file content.
 */
function relocateImportsAndRequires(entryContent) {
  const importRegex = /import\s+.*?from\s*['"](.*?)['"];?/g;
  const requireRegex = /(const\s+.*?=\s*require\(.*\).*);/g;

  const importsList = [...entryContent.matchAll(importRegex)].map(
    (match) => match[0],
  );
  const requiresList = [...entryContent.matchAll(requireRegex)].map(
    (match) => match[0],
  );

  let newCode = entryContent.replace(importRegex, '').replace(requireRegex, '');
  newCode = `${[...importsList, ...requiresList].join('\n')}\n${newCode}`;

  return newCode;
}

export default relocateImportsAndRequires;
