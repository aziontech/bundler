/**
 * Move requires and imports to file init while preserving comments.
 * @param {string} entryContent - The file content to be fixed.
 * @returns {string} The fixed file content.
 */
function relocateImportsAndRequires(entryContent) {
  const importRegex = /import\s+.*?['"](.*?)['"];?/g;
  const requireRegex = /const\s.*?=\s*require\(['"](.*?)['"]\);?/g;

  // Check if string is part of a comment
  const isCommented = (str, index) => {
    const lineStart = str.lastIndexOf('\n', index) + 1;
    const lineEnd = str.indexOf('\n', index);
    const line = str.slice(lineStart, lineEnd !== -1 ? lineEnd : undefined);
    return line.trimStart().startsWith('//') || /\/\*.*\*\//g.test(line);
  };

  const importsList = [...entryContent.matchAll(importRegex)]
    .filter((match) => !isCommented(entryContent, match.index))
    .map((match) => match[0]);

  const requiresList = [...entryContent.matchAll(requireRegex)]
    .filter((match) => !isCommented(entryContent, match.index))
    .map((match) => match[0]);

  let newCode = entryContent
    .replace(importRegex, (match, p1, offset) =>
      isCommented(entryContent, offset) ? match : '',
    )
    .replace(requireRegex, (match, p1, offset) =>
      isCommented(entryContent, offset) ? match : '',
    );

  newCode = `${[...importsList, ...requiresList].join('\n')}\n${newCode}`;

  return newCode;
}

export default relocateImportsAndRequires;
