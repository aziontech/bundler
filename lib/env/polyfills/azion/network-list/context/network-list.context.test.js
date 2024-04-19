import { it } from '@jest/globals';
import mockFs from 'mock-fs';
import NetworkListContext from './network-list.context.js';

describe('Network List Context', () => {
  let networkListContext;

  beforeEach(async () => {
    // eslint-disable-next-line jest/no-standalone-expect
    const typeImport = expect.getState().currentTestName.includes('commonjs')
      ? 'module.exports ='
      : 'export default';
    const code = `${typeImport} {
        networkList:  [
            { id: 1, listType: "ip_cidr", listContent: ["10.0.0.1"] },
            { id: 2, listType: "asn", listContent: [123, 456, 789]},
            { id: 3, listType: "countries", listContent: ["United States", "Brazil"]}
        ]};`;
    mockFs({
      'azion.config.js': code,
    });
    networkListContext = new NetworkListContext();
  });

  afterEach(() => {
    mockFs.restore();
  });

  it('should contain the valid ip in the network list and list type is ip_cidr', async () => {
    expect(networkListContext.contains(1, '10.0.0.1')).toBe(true);
  });

  it('should contain the valid asn in the network list and list type is asn', async () => {
    expect(networkListContext.contains(2, 123)).toBe(true);
  });

  it('should contain the valid country in the network list and list type is countries', async () => {
    expect(networkListContext.contains(3, 'United States')).toBe(true);
  });

  it('should type import be commonjs and contain the valid ip in the network list and list type is ip_cidr', async () => {
    expect(networkListContext.contains(1, '10.0.0.1')).toBe(true);
  });
});
