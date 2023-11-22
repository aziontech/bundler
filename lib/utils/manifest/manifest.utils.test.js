import {
  afterEach,
  beforeEach,
  describe,
  test,
  expect,
  jest,
} from '@jest/globals';
import Manifest from './index.js';

jest.mock('fs');

describe('Manifest class', () => {
  let setRouteSpy;
  let setFileSpy;

  beforeEach(() => {
    // Spy on the methods of the Manifest instance before each test
    setRouteSpy = jest.spyOn(Manifest, 'setRoute');
    setFileSpy = jest.spyOn(Manifest, 'setFile');
  });

  afterEach(() => {
    // Clear all mocks after each test
    jest.clearAllMocks();
  });

  test('setRoute should add a route to the manifest', () => {
    // Define the input
    const mode = 'compute';
    const route = {
      from: '/from/path',
      to: '/to/path',
      priority: 1,
    };

    // Call the setRoute method with the input
    Manifest.setRoute(mode, route);

    // Check if the setRoute method was called with the correct arguments
    expect(setRouteSpy).toHaveBeenCalledWith(mode, route);
  });

  test('setFile should add a file to the manifest', () => {
    // Define the input
    const variableName = 'file';
    const filePath = '/path/to/file';

    // Call the setFile method with the input
    Manifest.setFile(variableName, filePath);

    // Check if the setFile method was called with the correct arguments
    expect(setFileSpy).toHaveBeenCalledWith(variableName, filePath);
  });
});
