import fs from 'fs';
import { feedback } from '#utils';
// eslint-disable-next-line import/no-extraneous-dependencies
import { markdownTable } from 'markdown-table';

/**
 *
 */
function processE2EReports() {
  try {
    feedback.interactive.await('Processing Jest report...');

    // Read the JSON file
    const data = fs.readFileSync('e2e_results.json');
    const results = JSON.parse(data);

    // Process the test results
    results.testResults = results.testResults.map((test) => {
      // Remove the path from the test name
      const testName = test.name
        .split('/')
        .pop()
        .replace('.test.js', '')
        .replace(/-/g, ' ');

      // ignore simple examples
      if (test.name.startsWith('simple')) {
        return null;
      }
      // Transform the test name into a more readable format
      const readableTestName = testName
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      return {
        name: readableTestName,
        passed: test.numFailingTests === 0,
      };
    });

    // Update the overall test status
    results.passes = results.testResults.every((test) => test.passed);

    // Create a new object with the testResults and passes properties
    const newResults = {
      testResults: results.testResults,
      passes: results.passes,
    };

    // Write the new object back to the JSON file
    fs.writeFileSync('e2e_results.json', JSON.stringify(newResults, null, 2));

    // Create the Markdown table
    const table = [
      ['Test', 'Status'],
      ...results.testResults.map((test) => [
        test.name,
        test.passed ? '✅' : '⚠️',
      ]),
    ];

    // Write the Markdown table to the README.md file
    const readme = fs.readFileSync('README.md', 'utf8');
    const newReadme = readme.replace(
      /## Quick Installation/,
      `## Supported\n\n${markdownTable(
        table,
      )}\n\n Date of the last time the test was run: ${new Date().toLocaleDateString()}\n\n## Quick Installation`,
    );
    fs.writeFileSync('README.md', newReadme);

    feedback.interactive.success('Report processed successfully.');
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

// Call the function
processE2EReports();
