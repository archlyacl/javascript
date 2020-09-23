const { getValue } = require('./common');
const { NullError } = require('./error');

class Module {
  constructor(id) {
    this.id = id;
  }
}

class Resource {
  constructor(id) {
    this.id = id;
  }

  getId() {
    return this.id;
  }
}

class Role {
  constructor(name) {
    this.name = name;
  }

  toString() {
    return this.name;
  }
}

describe('Code coverage for getValue', () => {
  test('Null input', () => {
    expect(() => {
      getValue(null);
    }).toThrow(NullError);
  });

  test('String input', () => {
    expect(getValue('a')).toBe('a');
  });

  test('getId returns string', () => {
    var r1 = new Resource('1');
    expect(getValue(r1)).toBe('1');
  });

  test('getId returns number', () => {
    var r1 = new Resource(1);
    expect(getValue(r1)).toBe('[object Object]');
  });

  test('id as string', () => {
    var m1 = new Module('1');
    expect(getValue(m1)).toBe('1');
  });

  test('id as number', () => {
    var m1 = new Module(1);
    expect(getValue(m1)).toBe('[object Object]');
  });

  test('toString', () => {
    var r1 = new Role('a');
    expect(getValue(r1)).toBe('a');
  });
});
