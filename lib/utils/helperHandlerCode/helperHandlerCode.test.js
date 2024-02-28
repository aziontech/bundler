import helperHandlerCode from './index.js';

describe('Helper Handler Code Utils', () => {
  describe('checkAndChangeAddEventListener', () => {
    it('should return unchanged code and matchEvent as false when there is no firewall event', () => {
      const code = 'addEventListener("fetch", (event) => {});';
      const result = helperHandlerCode.checkAndChangeAddEventListener(
        'firewall',
        'fetch',
        code,
      );
      expect(result).toEqual({ matchEvent: false, codeChanged: code });
    });

    it('should return changed code and matchEvent as true when there is a firewall event', () => {
      const code = 'addEventListener("firewall", (event) => {});';
      const expectedCode = 'addEventListener("fetch", (event) => {});';
      const result = helperHandlerCode.checkAndChangeAddEventListener(
        'firewall',
        'fetch',
        code,
      );
      expect(result).toEqual({
        matchEvent: true,
        codeChanged: expectedCode,
      });
    });
  });
});
