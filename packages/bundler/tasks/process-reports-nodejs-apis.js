import fs from 'fs';
import { feedback } from '@aziontech/utils/node';

/**
 *
 */
function processReports() {
  try {
    feedback.interactive.await('Processing Node.js APIs report...');

    // Read the JSON file
    const data = fs.readFileSync('nodejs_apis_results.json');
    const results = JSON.parse(data);

    // Process the test results
    results.testResults = results.testResults.map((test) => {
      // Remove the path from the test name
      const testName = test.name.split('/').pop().replace('.test.js', '').replace(/-/g, ' ');

      // Transform the test name into a more readable format
      const readableTestName = testName
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      // Check if all tests in the suite passed
      const suitePassed = test.assertionResults.every((result) => result.status === 'passed');

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
    fs.writeFileSync('nodejs_apis_results.json', JSON.stringify(newResults, null, 2));

    feedback.interactive.success('Report processed successfully.');
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

// Call the function
processReports();
