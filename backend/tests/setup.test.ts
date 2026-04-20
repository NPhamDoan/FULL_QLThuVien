describe('Project Setup', () => {
  it('should have TypeScript configured correctly', () => {
    const value: string = 'Library Management System';
    expect(value).toBe('Library Management System');
  });

  it('should have fast-check available', () => {
    const fc = require('fast-check');
    expect(fc).toBeDefined();
    expect(typeof fc.assert).toBe('function');
  });
});
