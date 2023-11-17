import mockFs from 'mock-fs';
import fs from 'fs';
import { spawn } from 'child_process';
import { VercelUtils } from '#utils';

const { deleteTelemetryFiles, createVercelProjectConfig, runVercelBuild } =
  VercelUtils;

describe('Vercel Utils', () => {
  it('Should delete telemtry files', () => {
    mockFs({
      '.vercel': {
        output: {
          static: {
            _next: {
              __private: {
                'next-telemetry.js': 'telemetry',
              },
            },
          },
        },
      },
    });

    deleteTelemetryFiles();

    expect(fs.existsSync('.vercel/output/static/_next/__private')).toBe(false);

    mockFs.restore();
  });

  it('Should create vercel project config', () => {
    mockFs({
      '.vercel': {},
    });

    const projectConfigContent = { projectId: '_', orgId: '_', settings: {} };

    createVercelProjectConfig();
    const projectConfig = fs.readFileSync('.vercel/project.json', 'utf-8');

    expect(fs.existsSync('.vercel/project.json')).toBe(true);
    expect(projectConfig).toEqual(JSON.stringify(projectConfigContent));

    mockFs.restore();
  });
});

jest.mock('child_process');

describe('runVercelBuild', () => {
  it('should resolve the promise when the command succeeds', async () => {
    // eslint-disable-next-line no-unused-vars
    spawn.mockImplementationOnce((cmd, args, options) => {
      const execProcess = {
        on: jest.fn(),
      };

      // Simulate a successful command execution
      execProcess.on.mockImplementationOnce((event, callback) => {
        if (event === 'close') {
          callback(0); // Simulate a successful exit code
        }
      });

      return execProcess;
    });

    await expect(runVercelBuild()).resolves.toEqual(undefined);

    expect(spawn).toHaveBeenCalledWith(
      'npx',
      ['--yes', 'vercel@32.2.1', 'build', '--prod'],
      {
        shell: true,
        stdio: 'inherit',
      },
    );
  });

  it('should reject the promise when the command fails', async () => {
    // eslint-disable-next-line no-unused-vars
    spawn.mockImplementationOnce((cmd, args, options) => {
      const execProcess = {
        on: jest.fn(),
      };

      execProcess.on.mockImplementationOnce((event, callback) => {
        if (event === 'close') {
          callback(1);
        }
      });

      return execProcess;
    });

    await expect(runVercelBuild()).rejects.toThrow(
      "Command '--yes vercel@32.2.1 build --prod' failed with code 1",
    );

    expect(spawn).toHaveBeenCalledWith(
      'npx',
      ['--yes', 'vercel@32.2.1', 'build', '--prod'],
      {
        shell: true,
        stdio: 'inherit',
      },
    );
  });
});
