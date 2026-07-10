import fs from 'fs';
import { feedback } from '@aziontech/utils/node';

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
      const testName = test.name.split('/').pop().replace('.test.js', '').replace(/-/g, ' ');

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

    feedback.interactive.success('Report processed successfully.');
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

// Call the function
processE2EReports();
