import fs from 'fs';
import { feedback } from 'azion/utils/node';
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
      if (!test || !test.name) {
        console.log('Invalid test found:', test);
        return {
          name: 'Unknown Test',
          passed: false,
        };
      }

      // Remove the path from the test name
      const testName = test.name
        .split('/')
        .pop()
        .replace('.test.js', '')
        .replace(/-/g, ' ');

      // Transform the test name into a more readable format
      const readableTestName = testName
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      // Check if all tests in the suite passed - with safety checks
      let suitePassed = false;
      try {
        if (
          test.assertionResults &&
          Array.isArray(test.assertionResults) &&
          test.assertionResults.length > 0
        ) {
          suitePassed = test.assertionResults.every(
            (result) => result && result.status === 'passed',
          );
        }
      } catch (error) {
        console.log('Error processing test results:', test.name, error);
      }

      return {
        name: readableTestName,
        passed: suitePassed,
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
      ...newResults.testResults.map((test) => [
        test.name,
        test.passed ? '✅' : '⚠️',
      ]),
    ];

    // Write the Markdown table to the README.md file
    const readme = fs.readFileSync('README.md', 'utf8');
    console.log('Reading README.md...');

    // Simplified regular expression
    const pattern = /(## Supported Features[\s\S]*?)(## Contributing)/;
    const hasMatch = pattern.test(readme);
    console.log('Pattern found in README:', hasMatch);

    if (!hasMatch) {
      console.error('Could not find the correct section in README.');
      return;
    }

    const newReadme = readme.replace(
      pattern,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (match, supportedFeatures, contributing) => {
        const dateOptions = {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
        };
        const timeOptions = {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        };
        const newDate = `${new Date().toLocaleDateString(
          'en-US',
          dateOptions,
        )} ${new Date().toLocaleTimeString('en-US', timeOptions)}`;

        return `## Supported Features\n\nE2E tests run daily in the [Bundler Examples](https://github.com/aziontech/bundler-examples/tree/main/examples) to ensure that the presets and frameworks continue to work correctly.\n\nTable:\n${markdownTable(table)}\n\nLast test run date: ${newDate}\n\n## Contributing`;
      },
    );

    if (readme === newReadme) {
      console.error('No changes were made to the content.');
      return;
    }

    fs.writeFileSync('README.md', newReadme);

    feedback.interactive.success('Report processed successfully.');
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

// Call the function
processE2EReports();
