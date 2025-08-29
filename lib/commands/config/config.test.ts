// import { createConfig, updateConfig, readConfig, deleteConfig } from './config';
// import { configCommand } from './command';
// import type { AzionConfig, AzionBuild, AzionEdgeApplication, AzionRequestRule } from 'azion/config';

// // Mock das funções de ambiente
// jest.mock('#env', () => ({
//   readAzionConfig: jest.fn(),
//   writeUserConfig: jest.fn(),
// }));

// import { readAzionConfig, writeUserConfig } from '#env';

// const mockReadAzionConfig = readAzionConfig as jest.MockedFunction<typeof readAzionConfig>;
// const mockWriteUserConfig = writeUserConfig as jest.MockedFunction<typeof writeUserConfig>;

// describe('Config CRUD Operations', () => {
//   describe('createConfig', () => {
//     it('should create a simple property', () => {
//       const result = createConfig({
//         key: 'build.preset',
//         value: 'typescript',
//       });

//       expect(result).toEqual({
//         build: {
//           preset: 'typescript',
//         },
//       });
//     });

//     it('should create a build configuration', () => {
//       const buildConfig: AzionBuild = {
//         entry: './src/index.ts',
//         bundler: 'webpack',
//         preset: 'typescript',
//         polyfills: true,
//       };

//       const result = createConfig({
//         key: 'build',
//         value: buildConfig,
//       });

//       expect(result).toEqual({
//         build: buildConfig,
//       });
//     });

//     it('should create an edge application', () => {
//       const edgeApp: AzionEdgeApplication = {
//         name: 'My Application',
//         edgeCacheEnabled: true,
//         functionEnabled: true,
//         applicationAcceleratorEnabled: true,
//         active: true,
//       };

//       const result = createConfig({
//         key: 'applications[0]',
//         value: edgeApp,
//       });

//       expect(result).toEqual({
//         applications: [edgeApp],
//       });
//     });

//     it('should create a request rule', () => {
//       const rule: AzionRequestRule = {
//         name: 'My Rule',
//         description: 'Test rule',
//         active: true,
//         behavior: {
//           bypassCache: true,
//         },
//       };

//       const result = createConfig({
//         key: 'applications[0].rules.request[0]',
//         value: rule,
//       });

//       expect(result).toEqual({
//         applications: [
//           {
//             rules: {
//               request: [rule],
//             },
//           },
//         ],
//       });
//     });
//   });

//   describe('updateConfig', () => {
//     const baseConfig: AzionConfig = {
//       build: {
//         entry: './src/index.ts',
//         bundler: 'webpack',
//         preset: 'javascript',
//         polyfills: true,
//         worker: false,
//       },
//       applications: [
//         {
//           name: 'Old App',
//           edgeCacheEnabled: true,
//           rules: {
//             request: [
//               { name: 'Rule 1', behavior: { bypassCache: true } },
//               { name: 'Rule 2', behavior: { bypassCache: false } },
//             ],
//           },
//         },
//       ],
//     };

//     it('should update a build property', () => {
//       const result = updateConfig({
//         key: 'build.preset',
//         value: 'typescript',
//         config: baseConfig,
//       });

//       expect(result.build?.preset).toBe('typescript');
//     });

//     it('should update an edge application property', () => {
//       const result = updateConfig({
//         key: 'applications[0].name',
//         value: 'New App',
//         config: baseConfig,
//       });

//       expect(result.applications?.[0].name).toBe('New App');
//     });

//     it('should update a request rule', () => {
//       const result = updateConfig({
//         key: 'applications[0].rules.request[1].name',
//         value: 'New Rule',
//         config: baseConfig,
//       });

//       expect(result.applications?.[0].rules?.request?.[1].name).toBe('New Rule');
//     });

//     it('should update entire array element', () => {
//       const newApp = {
//         name: 'New App',
//         edgeCacheEnabled: false,
//         rules: {
//           request: [{ name: 'New Rule', behavior: { bypassCache: true } }],
//         },
//       };

//       const result = updateConfig({
//         key: 'applications[0]',
//         value: newApp,
//         config: baseConfig,
//       });

//       expect(result.applications?.[0]).toEqual(newApp);
//     });

//     it('should update nested array element', () => {
//       const newRule = {
//         name: 'New Rule',
//         behavior: { bypassCache: true },
//       };

//       const result = updateConfig({
//         key: 'applications[0].rules.request[0]',
//         value: newRule,
//         config: baseConfig,
//       });

//       expect(result.applications?.[0].rules?.request?.[0]).toEqual(newRule);
//     });

//     it('should create property if it does not exist', () => {
//       const result = updateConfig({
//         key: 'nonexistent.property',
//         value: 'value',
//         config: baseConfig,
//       });

//       expect((result as never)['nonexistent']).toEqual({ property: 'value' });
//     });

//     it('should extend array when accessing out of bounds index', () => {
//       const result = updateConfig({
//         key: 'applications[1].name',
//         value: 'New App',
//         config: baseConfig,
//       });

//       expect(result.applications).toHaveLength(2);
//       expect(result.applications?.[1].name).toBe('New App');
//     });

//     it('should throw error if property is not an array', () => {
//       expect(() => {
//         updateConfig({
//           key: 'build.preset[0]',
//           value: 'value',
//           config: baseConfig,
//         });
//       }).toThrow("Property 'preset' is not an array but trying to access array index");
//     });

//     it('should throw error if trying to access array index on non-array', () => {
//       expect(() => {
//         updateConfig({
//           key: 'build[0]',
//           value: 'value',
//           config: baseConfig,
//         });
//       }).toThrow("Property 'build' is not an array but trying to access array index");
//     });

//     it('should extend nested arrays when needed', () => {
//       const result = updateConfig({
//         key: 'applications[0].rules.request[2]',
//         value: { name: 'New Rule' },
//         config: baseConfig,
//       });

//       expect(result.applications?.[0].rules?.request).toHaveLength(3);
//       expect(result.applications?.[0].rules?.request?.[2]).toEqual({ name: 'New Rule' });
//     });
//   });

//   describe('readConfig', () => {
//     const baseConfig: AzionConfig = {
//       build: {
//         entry: './src/index.ts',
//         bundler: 'webpack',
//         preset: 'typescript',
//         polyfills: true,
//         worker: false,
//       },
//       applications: [
//         {
//           name: 'My App',
//           edgeCacheEnabled: true,
//           rules: {
//             request: [
//               { name: 'Rule 1', behavior: { bypassCache: true } },
//               { name: 'Rule 2', behavior: { bypassCache: false } },
//             ],
//           },
//         },
//       ],
//     };

//     it('should read a build property', () => {
//       const result = readConfig({
//         key: 'build.preset',
//         config: baseConfig,
//       });

//       expect(result).toBe('typescript');
//     });

//     it('should read an edge application property', () => {
//       const result = readConfig({
//         key: 'applications[0].name',
//         config: baseConfig,
//       });

//       expect(result).toBe('My App');
//     });

//     it('should read a request rule', () => {
//       const result = readConfig({
//         key: 'applications[0].rules.request[1].name',
//         config: baseConfig,
//       });

//       expect(result).toBe('Rule 2');
//     });

//     it('should read entire array element', () => {
//       const result = readConfig({
//         key: 'applications[0]',
//         config: baseConfig,
//       });

//       expect(result).toEqual({
//         name: 'My App',
//         edgeCacheEnabled: true,
//         rules: {
//           request: [
//             { name: 'Rule 1', behavior: { bypassCache: true } },
//             { name: 'Rule 2', behavior: { bypassCache: false } },
//           ],
//         },
//       });
//     });

//     it('should read nested array element', () => {
//       const result = readConfig({
//         key: 'applications[0].rules.request[0]',
//         config: baseConfig,
//       });

//       expect(result).toEqual({
//         name: 'Rule 1',
//         behavior: { bypassCache: true },
//       });
//     });

//     it('should throw error if property does not exist', () => {
//       expect(() => {
//         readConfig({
//           key: 'nonexistent.property',
//           config: baseConfig,
//         });
//       }).toThrow("Property 'nonexistent' does not exist");
//     });

//     it('should throw error if array index does not exist', () => {
//       expect(() => {
//         readConfig({
//           key: 'applications[1].name',
//           config: baseConfig,
//         });
//       }).toThrow("Array index 1 does not exist in 'applications'");
//     });

//     it('should throw error if property is not an array', () => {
//       expect(() => {
//         readConfig({
//           key: 'build.preset[0]',
//           config: baseConfig,
//         });
//       }).toThrow("Property 'preset' is not an array");
//     });

//     it('should throw error if trying to access array index on non-array', () => {
//       expect(() => {
//         readConfig({
//           key: 'build[0]',
//           config: baseConfig,
//         });
//       }).toThrow("Property 'build' is not an array");
//     });

//     it('should throw error if array index is out of bounds', () => {
//       expect(() => {
//         readConfig({
//           key: 'applications[0].rules.request[2]',
//           config: baseConfig,
//         });
//       }).toThrow("Array index 2 does not exist in 'request'");
//     });
//   });

//   describe('deleteConfig', () => {
//     const baseConfig: AzionConfig = {
//       build: {
//         entry: './src/index.ts',
//         bundler: 'webpack',
//         preset: 'typescript',
//         polyfills: true,
//         worker: false,
//       },
//       applications: [
//         {
//           name: 'My App',
//           edgeCacheEnabled: true,
//           rules: {
//             request: [
//               { name: 'Rule 1', behavior: { bypassCache: true } },
//               { name: 'Rule 2', behavior: { bypassCache: false } },
//             ],
//           },
//         },
//       ],
//     };

//     it('should delete a build property', () => {
//       const result = deleteConfig({
//         key: 'build.preset',
//         config: baseConfig,
//       });

//       expect(result.build?.preset).toBeUndefined();
//     });

//     it('should delete a request rule', () => {
//       const result = deleteConfig({
//         key: 'applications[0].rules.request[1]',
//         config: baseConfig,
//       });

//       expect(result.applications?.[0].rules?.request).toHaveLength(1);
//       expect(result.applications?.[0].rules?.request?.[0].name).toBe('Rule 1');
//     });

//     it('should delete an edge application', () => {
//       const result = deleteConfig({
//         key: 'applications[0]',
//         config: baseConfig,
//       });

//       expect(result.applications).toHaveLength(0);
//     });

//     it('should throw error if property does not exist', () => {
//       expect(() => {
//         deleteConfig({
//           key: 'nonexistent.property',
//           config: baseConfig,
//         });
//       }).toThrow("Property 'nonexistent' does not exist");
//     });

//     it('should throw error if array index does not exist', () => {
//       expect(() => {
//         deleteConfig({
//           key: 'applications[1]',
//           config: baseConfig,
//         });
//       }).toThrow("Array index 1 does not exist in 'applications'");
//     });
//   });
// });

// describe('Config Command with Multiple Arguments', () => {
//   const baseConfig: AzionConfig = {
//     build: {
//       entry: './src/index.ts',
//       bundler: 'webpack',
//       preset: 'javascript',
//       polyfills: true,
//       worker: false,
//     },
//     applications: [
//       {
//         name: 'Old App',
//         edgeCacheEnabled: true,
//       },
//     ],
//     functions: [
//       {
//         name: 'Old Function',
//         path: './functions/old.js',
//       },
//     ],
//   };

//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   it('should update multiple properties at once', async () => {
//     mockReadAzionConfig.mockResolvedValue(baseConfig);
//     mockWriteUserConfig.mockResolvedValue();

//     const result = (await configCommand({
//       command: 'update',
//       options: {
//         key: ['applications[0].name', 'functions[0].name'],
//         value: ['API Produção', 'Function Produção'],
//       },
//     })) as AzionConfig;

//     expect(result.applications?.[0].name).toBe('API Produção');
//     expect(result.functions?.[0].name).toBe('Function Produção');
//     expect(mockWriteUserConfig).toHaveBeenCalledWith(result);
//   });

//   it('should update multiple build settings', async () => {
//     mockReadAzionConfig.mockResolvedValue(baseConfig);
//     mockWriteUserConfig.mockResolvedValue();

//     const result = (await configCommand({
//       command: 'update',
//       options: {
//         key: ['build.preset', 'build.polyfills', 'build.worker'],
//         value: ['typescript', false, true],
//       },
//     })) as AzionConfig;

//     expect(result.build?.preset).toBe('typescript');
//     expect(result.build?.polyfills).toBe(false);
//     expect(mockWriteUserConfig).toHaveBeenCalledWith(result);
//   });

//   it('should throw error if number of keys and values do not match', async () => {
//     mockReadAzionConfig.mockResolvedValue(baseConfig);

//     await expect(
//       configCommand({
//         command: 'update',
//         options: {
//           key: ['build.preset', 'build.polyfills'],
//           value: ['typescript'], // Only one value for two keys
//         },
//       }),
//     ).rejects.toThrow('Number of keys (2) must match number of values (1)');
//   });

//   it('should handle single key-value pair same as before', async () => {
//     mockReadAzionConfig.mockResolvedValue(baseConfig);
//     mockWriteUserConfig.mockResolvedValue();

//     const result = (await configCommand({
//       command: 'update',
//       options: {
//         key: 'applications[0].name',
//         value: 'Single Update',
//       },
//     })) as AzionConfig;

//     expect(result.applications?.[0].name).toBe('Single Update');
//     expect(mockWriteUserConfig).toHaveBeenCalledWith(result);
//   });

//   it('should only support multiple arguments for update command', async () => {
//     mockReadAzionConfig.mockResolvedValue(baseConfig);

//     // Read command should use only the first key
//     const readResult = await configCommand({
//       command: 'read',
//       options: {
//         key: ['applications[0].name', 'functions[0].name'],
//       },
//     });

//     expect(readResult).toBe('Old App'); // Should return only first key's value
//   });
// });
