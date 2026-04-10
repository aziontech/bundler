import { existsSync } from 'fs';
import { join } from 'path';
import { feedback } from '@aziontech/utils/node';
import { DIRECTORIES } from '../../constants';

/**
 * Opens the telemetry HTML report in the default browser.
 *
 * @param options - Command options
 * @param options.path - Custom path to the telemetry HTML file (optional)
 *
 * @example
 * // Open default telemetry report
 * telemetryCommand({});
 *
 * // Open custom telemetry report
 * telemetryCommand({ path: './custom-report.html' });
 */
export async function telemetryCommand(options: { path?: string } = {}) {
  const telemetryHtmlPath =
    options.path || join(DIRECTORIES.OUTPUT_BASE_PATH, 'telemetry-report.html');

  // Check if the file exists
  if (!existsSync(telemetryHtmlPath)) {
    feedback.error(
      `Telemetry report not found at: ${telemetryHtmlPath}\n\n` +
        'Make sure you have run a build with the --telemetry flag first.\n' +
        'Example: ef build --telemetry html\n' +
        'Or: ef build --telemetry',
    );
    process.exit(1);
  }

  try {
    // Detect the platform and open the file with the default browser
    const platform = process.platform;
    let command: string;

    if (platform === 'darwin') {
      command = `open "${telemetryHtmlPath}"`;
    } else if (platform === 'win32') {
      command = `start "" "${telemetryHtmlPath}"`;
    } else {
      // Linux and other platforms
      command = `xdg-open "${telemetryHtmlPath}"`;
    }

    const { exec } = await import('child_process');
    exec(command, (error) => {
      if (error) {
        feedback.error(`Failed to open telemetry report: ${error.message}`);
        process.exit(1);
      }
      feedback.success(`Opened telemetry report: ${telemetryHtmlPath}`);
    });
  } catch (error) {
    feedback.error(
      `Failed to open telemetry report: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
    process.exit(1);
  }
}
