const { ASTERISK } = require('./common');
const { InvalidError } = require('./error');
const error = require('./error');
const perm = require('./permission');

test('isAllowed()/isDenied()', function () {
  var res1 = 'RES-1',
    rol1 = 'ROLE-1',
    nullres = null,
    nullrol = null,
    P = new perm.Permission();

  // Permissions not set yet.
  expect(P.isAllowedAll(rol1, res1)).toBeNull();
  expect(P.isDeniedAll(rol1, res1)).toBeNull();
  expect(P.isAllowedAll(rol1)).toBeNull();
  expect(P.isDeniedAll(rol1)).toBeNull();
  expect(P.isAllowedAll(null, res1)).toBeNull();
  expect(P.isDeniedAll(null, res1)).toBeNull();
  expect(P.isAllowedAll(nullrol, nullres)).toBe(false);

  // Default is to deny.
  expect(P.isDeniedAll(nullrol, nullres)).toBe(true);

  P.makeDefaultAllow();
  // Permissions not set yet.
  expect(P.isAllowedAll(rol1, res1)).toBeNull();
  expect(P.isAllowedAll(rol1, null)).toBeNull();
  expect(P.isAllowedAll(null, res1)).toBeNull();
  // Default is to allow.
  expect(P.isAllowedAll(nullrol, nullres)).toBe(true);
  expect(P.isAllowed(nullrol, nullres, perm.Types.CREATE)).toBe(true);
  expect(P.isDeniedAll(nullrol, nullres)).toBe(false);
  // TODO

  P.makeDefaultDeny();

  // Permissions not set yet.
  expect(P.isDeniedAll(rol1, res1)).toBeNull();
  expect(P.isDeniedAll(rol1, null)).toBeNull();
  expect(P.isDeniedAll(null, res1)).toBeNull();
  // Default is to deny.
  expect(P.isDeniedAll(nullrol, nullres, perm.Types.CREATE)).toBe(true);
  expect(P.isAllowedAll(nullres, nullrol)).toBe(false);
});

test('allow()', function () {
  var res1 = 'RES-1',
    rol1 = 'ROLE-1',
    P = new perm.Permission();

  // Permissions not set yet.
  expect(P.isAllowedAll(rol1, res1)).toBeNull();
  expect(P.isDeniedAll(rol1, res1)).toBeNull();

  P.allow(rol1, res1);

  // rol1 allowed access to res1
  expect(P.isAllowedAll(rol1, res1)).toBe(true);
  expect(P.isAllowed(rol1, res1, perm.Types.CREATE)).toBe(true);
  expect(P.isAllowed(rol1, res1, perm.Types.READ)).toBe(true);
  expect(P.isAllowed(rol1, res1, perm.Types.UPDATE)).toBe(true);
  expect(P.isAllowed(rol1, res1, perm.Types.DELETE)).toBe(true);
  expect(P.isAllowed(rol1, res1, 'play')).toBe(true);
  expect(P.isDeniedAll(rol1, res1)).toBe(false);
  expect(P.isDenied(rol1, res1, perm.Types.CREATE)).toBe(false);
  expect(P.isDenied(rol1, res1, perm.Types.READ)).toBe(false);
  expect(P.isDenied(rol1, res1, perm.Types.UPDATE)).toBe(false);
  expect(P.isDenied(rol1, res1, perm.Types.DELETE)).toBe(false);
  expect(P.isDenied(rol1, res1, 'play')).toBe(false);

  P.deny(rol1, res1, perm.Types.UPDATE);
  P.deny(rol1, res1, perm.Types.DELETE);

  // No longer ALLOW ALL.
  expect(P.isAllowedAll(rol1, res1)).toBe(false);
  // rol1 allowed access to res1 on ALL, denied on UPDATE and DELETE.
  expect(P.isAllowed(rol1, res1, perm.Types.CREATE)).toBe(true);
  expect(P.isAllowed(rol1, res1, perm.Types.READ)).toBe(true);
  expect(P.isAllowed(rol1, res1, perm.Types.UPDATE)).toBe(false);
  expect(P.isAllowed(rol1, res1, perm.Types.DELETE)).toBe(false);

  // Not all actions are denied.
  expect(P.isDeniedAll(rol1, res1)).toBe(false);
  expect(P.isDenied(rol1, res1, perm.Types.CREATE)).toBe(false);
  expect(P.isDenied(rol1, res1, perm.Types.READ)).toBe(false);
  expect(P.isDenied(rol1, res1, perm.Types.UPDATE)).toBe(true);
  expect(P.isDenied(rol1, res1, perm.Types.DELETE)).toBe(true);

  P.remove(rol1, res1, perm.Types.UPDATE);

  // rol1 still denied to res1 on DELETE.
  expect(P.isAllowedAll(rol1, res1)).toBe(false);
  expect(P.isAllowed(rol1, res1, perm.Types.CREATE)).toBe(true);
  expect(P.isAllowed(rol1, res1, perm.Types.READ)).toBe(true);
  expect(P.isAllowed(rol1, res1, perm.Types.UPDATE)).toBe(true);
  expect(P.isAllowed(rol1, res1, perm.Types.DELETE)).toBe(false);
  expect(P.isDeniedAll(rol1, res1)).toBe(false);
  expect(P.isDenied(rol1, res1, perm.Types.CREATE)).toBe(false);
  expect(P.isDenied(rol1, res1, perm.Types.READ)).toBe(false);
  expect(P.isDenied(rol1, res1, perm.Types.UPDATE)).toBe(false);
  expect(P.isDenied(rol1, res1, perm.Types.DELETE)).toBe(true);

  P.remove(rol1, res1);

  // Null because ALL is removed.
  expect(P.isAllowedAll(rol1, res1)).toBeNull();
  expect(P.isAllowed(rol1, res1, perm.Types.CREATE)).toBeNull();
  expect(P.isAllowed(rol1, res1, perm.Types.READ)).toBeNull();
  expect(P.isAllowed(rol1, res1, perm.Types.UPDATE)).toBeNull();
  expect(P.isAllowed(rol1, res1, perm.Types.DELETE)).toBeNull();
  expect(P.isDeniedAll(rol1, res1)).toBeNull();
  expect(P.isDenied(rol1, res1, perm.Types.CREATE)).toBeNull();
  expect(P.isDenied(rol1, res1, perm.Types.READ)).toBeNull();
  expect(P.isDenied(rol1, res1, perm.Types.UPDATE)).toBeNull();
  expect(P.isDenied(rol1, res1, perm.Types.DELETE)).toBeNull();

  P.deny(rol1, res1, perm.Types.DELETE);

  //ALL is removed, DELETE is deny, others are NULL
  expect(P.isAllowedAll(rol1, res1)).toBe(false);
  expect(P.isAllowed(rol1, res1, perm.Types.CREATE)).toBeNull();
  expect(P.isAllowed(rol1, res1, perm.Types.READ)).toBeNull();
  expect(P.isAllowed(rol1, res1, perm.Types.UPDATE)).toBeNull();
  expect(P.isAllowed(rol1, res1, perm.Types.DELETE)).toBe(false);
  expect(P.isDeniedAll(rol1, res1)).toBeNull();
  expect(P.isDenied(rol1, res1, perm.Types.CREATE)).toBeNull();
  expect(P.isDenied(rol1, res1, perm.Types.READ)).toBeNull();
  expect(P.isDenied(rol1, res1, perm.Types.UPDATE)).toBeNull();
  expect(P.isDenied(rol1, res1, perm.Types.DELETE)).toBe(true);

  P.allow(rol1, res1, perm.Types.CREATE);
  P.allow(rol1, res1, perm.Types.READ);
  P.allow(rol1, res1, perm.Types.DELETE);

  // ALL and UPDATE not set; CREATE, READ, and DELETE are allow.
  expect(P.isAllowedAll(rol1, res1)).toBeNull();
  expect(P.isAllowed(rol1, res1, perm.Types.CREATE)).toBe(true);
  expect(P.isAllowed(rol1, res1, perm.Types.READ)).toBe(true);
  expect(P.isAllowed(rol1, res1, perm.Types.UPDATE)).toBeNull();
  expect(P.isAllowed(rol1, res1, perm.Types.DELETE)).toBe(true);
  expect(P.isDeniedAll(rol1, res1)).toBe(false);
  expect(P.isDenied(rol1, res1, perm.Types.CREATE)).toBe(false);
  expect(P.isDenied(rol1, res1, perm.Types.READ)).toBe(false);
  expect(P.isDenied(rol1, res1, perm.Types.UPDATE)).toBeNull();
  expect(P.isDenied(rol1, res1, perm.Types.DELETE)).toBe(false);

  //equivalent of ALL allow
  P.allow(rol1, res1, perm.Types.UPDATE);

  // Allowed all known privileges except ALL.
  expect(P.isAllowedAll(rol1, res1)).toBe(true);
  expect(P.isAllowed(rol1, res1, perm.Types.CREATE)).toBe(true);
  expect(P.isAllowed(rol1, res1, perm.Types.READ)).toBe(true);
  expect(P.isAllowed(rol1, res1, perm.Types.UPDATE)).toBe(true);
  expect(P.isAllowed(rol1, res1, perm.Types.DELETE)).toBe(true);
  expect(P.isDeniedAll(rol1, res1)).toBe(false);
  expect(P.isDenied(rol1, res1, perm.Types.CREATE)).toBe(false);
  expect(P.isDenied(rol1, res1, perm.Types.READ)).toBe(false);
  expect(P.isDenied(rol1, res1, perm.Types.UPDATE)).toBe(false);
  expect(P.isDenied(rol1, res1, perm.Types.DELETE)).toBe(false);
});

test('deny()', function () {
  var res1 = 'RES-A',
    rol1 = 'ROLE-A',
    P = new perm.Permission();

  // Permisssions not set yet.
  expect(P.isAllowedAll(rol1, res1)).toBeNull();
  expect(P.isDeniedAll(rol1, res1)).toBeNull();

  P.allow(rol1, res1);

  // rol1 allowed access to res1
  expect(P.isAllowedAll(rol1, res1)).toBe(true);
  expect(P.isAllowed(rol1, res1, perm.Types.CREATE)).toBe(true);
  expect(P.isAllowed(rol1, res1, perm.Types.READ)).toBe(true);
  expect(P.isAllowed(rol1, res1, perm.Types.UPDATE)).toBe(true);
  expect(P.isAllowed(rol1, res1, perm.Types.DELETE)).toBe(true);
  expect(P.isDeniedAll(rol1, res1)).toBe(false);
  expect(P.isDenied(rol1, res1, perm.Types.CREATE)).toBe(false);
  expect(P.isDenied(rol1, res1, perm.Types.READ)).toBe(false);
  expect(P.isDenied(rol1, res1, perm.Types.UPDATE)).toBe(false);
  expect(P.isDenied(rol1, res1, perm.Types.DELETE)).toBe(false);

  P.deny(rol1, res1);

  // rol1 denied access to res1
  expect(P.isAllowedAll(rol1, res1)).toBe(false);
  expect(P.isAllowed(rol1, res1, perm.Types.CREATE)).toBe(false);
  expect(P.isAllowed(rol1, res1, perm.Types.READ)).toBe(false);
  expect(P.isAllowed(rol1, res1, perm.Types.UPDATE)).toBe(false);
  expect(P.isAllowed(rol1, res1, perm.Types.DELETE)).toBe(false);
  expect(P.isDeniedAll(rol1, res1)).toBe(true);
  expect(P.isDenied(rol1, res1, perm.Types.CREATE)).toBe(true);
  expect(P.isDenied(rol1, res1, perm.Types.READ)).toBe(true);
  expect(P.isDenied(rol1, res1, perm.Types.UPDATE)).toBe(true);
  expect(P.isDenied(rol1, res1, perm.Types.DELETE)).toBe(true);

  P.allow(rol1, res1, perm.Types.UPDATE);
  P.allow(rol1, res1, perm.Types.DELETE);

  // No longer DENY ALL.
  expect(P.isAllowedAll(rol1, res1)).toBe(false);
  expect(P.isAllowed(rol1, res1, perm.Types.CREATE)).toBe(false);
  expect(P.isAllowed(rol1, res1, perm.Types.READ)).toBe(false);
  expect(P.isAllowed(rol1, res1, perm.Types.UPDATE)).toBe(true);
  expect(P.isAllowed(rol1, res1, perm.Types.DELETE)).toBe(true);
  expect(P.isDeniedAll(rol1, res1)).toBe(false);
  expect(P.isDenied(rol1, res1, perm.Types.CREATE)).toBe(true);
  expect(P.isDenied(rol1, res1, perm.Types.READ)).toBe(true);
  expect(P.isDenied(rol1, res1, perm.Types.UPDATE)).toBe(false);
  expect(P.isDenied(rol1, res1, perm.Types.DELETE)).toBe(false);

  P.remove(rol1, res1, perm.Types.UPDATE);

  // rol1 stilled allowed to res1 on DELETE
  expect(P.isAllowedAll(rol1, res1)).toBe(false);
  expect(P.isAllowed(rol1, res1, perm.Types.CREATE)).toBe(false);
  expect(P.isAllowed(rol1, res1, perm.Types.READ)).toBe(false);
  expect(P.isAllowed(rol1, res1, perm.Types.UPDATE)).toBe(false);
  expect(P.isAllowed(rol1, res1, perm.Types.DELETE)).toBe(true);
  expect(P.isDeniedAll(rol1, res1)).toBe(false);
  expect(P.isDenied(rol1, res1, perm.Types.CREATE)).toBe(true);
  expect(P.isDenied(rol1, res1, perm.Types.READ)).toBe(true);
  expect(P.isDenied(rol1, res1, perm.Types.UPDATE)).toBe(true);
  expect(P.isDenied(rol1, res1, perm.Types.DELETE)).toBe(false);

  P.remove(rol1, res1);

  // Null because ALL is removed.
  expect(P.isAllowedAll(rol1, res1)).toBeNull();
  expect(P.isAllowed(rol1, res1, perm.Types.CREATE)).toBeNull();
  expect(P.isAllowed(rol1, res1, perm.Types.READ)).toBeNull();
  expect(P.isAllowed(rol1, res1, perm.Types.UPDATE)).toBeNull();
  expect(P.isAllowed(rol1, res1, perm.Types.DELETE)).toBeNull();
  expect(P.isDeniedAll(rol1, res1)).toBeNull();
  expect(P.isDenied(rol1, res1, perm.Types.CREATE)).toBeNull();
  expect(P.isDenied(rol1, res1, perm.Types.READ)).toBeNull();
  expect(P.isDenied(rol1, res1, perm.Types.UPDATE)).toBeNull();
  expect(P.isDenied(rol1, res1, perm.Types.DELETE)).toBeNull();

  P.allow(rol1, res1, perm.Types.DELETE);

  //ALL is removed, DELETE is deny, others are NULL
  expect(P.isAllowedAll(rol1, res1)).toBeNull();
  expect(P.isAllowed(rol1, res1, perm.Types.CREATE)).toBeNull();
  expect(P.isAllowed(rol1, res1, perm.Types.READ)).toBeNull();
  expect(P.isAllowed(rol1, res1, perm.Types.UPDATE)).toBeNull();
  expect(P.isAllowed(rol1, res1, perm.Types.DELETE)).toBe(true);
  expect(P.isDeniedAll(rol1, res1)).toBe(false);
  expect(P.isDenied(rol1, res1, perm.Types.CREATE)).toBeNull();
  expect(P.isDenied(rol1, res1, perm.Types.READ)).toBeNull();
  expect(P.isDenied(rol1, res1, perm.Types.UPDATE)).toBeNull();
  expect(P.isDenied(rol1, res1, perm.Types.DELETE)).toBe(false);

  P.deny(rol1, res1, perm.Types.CREATE);
  P.deny(rol1, res1, perm.Types.READ);
  P.deny(rol1, res1, perm.Types.DELETE);

  // ALL and UPDATE not set; CREATE, READ, and DELETE are deny.
  expect(P.isAllowedAll(rol1, res1)).toBe(false);
  expect(P.isAllowed(rol1, res1, perm.Types.CREATE)).toBe(false);
  expect(P.isAllowed(rol1, res1, perm.Types.READ)).toBe(false);
  expect(P.isAllowed(rol1, res1, perm.Types.UPDATE)).toBeNull();
  expect(P.isAllowed(rol1, res1, perm.Types.DELETE)).toBe(false);
  expect(P.isDeniedAll(rol1, res1)).toBeNull();
  expect(P.isDenied(rol1, res1, perm.Types.CREATE)).toBe(true);
  expect(P.isDenied(rol1, res1, perm.Types.READ)).toBe(true);
  expect(P.isDenied(rol1, res1, perm.Types.UPDATE)).toBeNull();
  expect(P.isDenied(rol1, res1, perm.Types.DELETE)).toBe(true);

  //equivalent of ALL deny
  P.deny(rol1, res1, perm.Types.UPDATE);

  // Denied all known privileges except ALL.
  expect(P.isAllowedAll(rol1, res1)).toBe(false);
  expect(P.isAllowed(rol1, res1, perm.Types.CREATE)).toBe(false);
  expect(P.isAllowed(rol1, res1, perm.Types.READ)).toBe(false);
  expect(P.isAllowed(rol1, res1, perm.Types.UPDATE)).toBe(false);
  expect(P.isAllowed(rol1, res1, perm.Types.DELETE)).toBe(false);
  expect(P.isDeniedAll(rol1, res1)).toBe(true);
  expect(P.isDenied(rol1, res1, perm.Types.CREATE)).toBe(true);
  expect(P.isDenied(rol1, res1, perm.Types.READ)).toBe(true);
  expect(P.isDenied(rol1, res1, perm.Types.UPDATE)).toBe(true);
  expect(P.isDenied(rol1, res1, perm.Types.DELETE)).toBe(true);
});

test('remove()', function () {
  var res1 = 'RES-1',
    rol1 = 'ROLE-1',
    resna = 'RES-NA',
    rolna = 'ROLE-NA',
    P = new perm.Permission();

  // Bootstrap the instance.
  P.deny(rol1, res1, perm.Types.DELETE);
  P.allow(rol1, res1, perm.Types.CREATE);
  P.allow(rol1, res1, perm.Types.READ);
  P.allow(rol1, res1, perm.Types.DELETE);
  P.allow(rol1, res1, perm.Types.UPDATE);
  P.deny(rol1, res1, perm.Types.CREATE);
  P.deny(rol1, res1, perm.Types.READ);
  P.deny(rol1, res1, perm.Types.DELETE);
  P.deny(rol1, res1, perm.Types.UPDATE);

  // Non-existing role and resource.
  expect(() => {
    P.remove(rolna, resna);
  }).toThrow(
    "Permission 'ROLE-NA::RES-NA' not found on 'ROLE-NA' for 'RES-NA'."
  );
  expect(() => {
    P.remove(rol1, resna);
  }).toThrow("Permission 'ROLE-1::RES-NA' not found on 'ROLE-1' for 'RES-NA'.");
  expect(() => {
    P.remove(rolna, res1);
  }).toThrow("Permission 'ROLE-NA::RES-1' not found on 'ROLE-NA' for 'RES-1'.");
  expect(() => {
    P.remove(rolna, resna, perm.Types.CREATE);
  }).toThrow(
    "Permission 'ROLE-NA::RES-NA' not found on 'ROLE-NA' for 'RES-NA'."
  );
  expect(() => {
    P.remove(rol1, resna, perm.Types.CREATE);
  }).toThrow("Permission 'ROLE-1::RES-NA' not found on 'ROLE-1' for 'RES-NA'.");
  expect(() => {
    P.remove(rolna, resna, perm.Types.CREATE);
  }).toThrow(
    "Permission 'ROLE-NA::RES-NA' not found on 'ROLE-NA' for 'RES-NA'."
  );
  expect(() => {
    P.remove(rolna, res1, perm.Types.CREATE);
  }).toThrow("Permission 'ROLE-NA::RES-1' not found on 'ROLE-NA' for 'RES-1'.");
  expect(P.remove(rol1, res1, perm.Types.CREATE)).toBeUndefined();
  expect(() => {
    // Exception when repeated.
    P.remove(rol1, res1, perm.Types.CREATE);
  }).toThrow("Permission 'CREATE' not found on 'ROLE-1' for 'RES-1'.");
  // expect(P.remove()).toBeUndefined(); // Removes the root privileges.
  expect(() => {
    P.remove();
  }).toThrow(error.NullError);
  expect(() => {
    P.remove(null, null, perm.Types.CREATE);
  }).toThrow(error.NullError);
});

/*
test('removeByResourceRole()', function () {
  var resources = ['Q1', 'Q2', 'Q3', 'Q4'],
    roles = ['P1', 'P2', 'P3', 'P4'],
    P = new perm.Permission();

  expect(P.size()).toBe(1); // *::*

  //create mappings for each key pair
  for (let i = 0; i < resources.length; i++) {
    for (let j = 0; j < roles.length; j++) {
      P.allow(roles[j], resources[i]);
    }
  }
  expect(P.toString()).toBeTruthy();
  // 1 + 4x4 mappings
  expect(P.size()).toBe(17);

  // Add ALL access.
  for (let i = 0; i < resources.length; i++) {
    P.allow(null, resources[i])
  }
  // 1 + 4x4 + 4
  expect(P.size()).toBe(21);

  for (let j = 0; j < roles.length; j++) {
    P.allow(roles[j], null);
  }
  // 1 + 4x4 + 4 + 4
  expect(P.size()).toBe(25);

  //remove all access on Q4
  let removed = P.removeByResource(resources[3]);
  // 1 + 4x3 + 4 +3
  expect(P.size()).toBe(20);
  expect(removed).toBe(5); // All Q4.

  //repeated removal should yield 0
  removed = P.removeByResource(resources[3]);
  expect(P.size()).toBe(20); // No change.
  expect(removed).toBe(0); // None removed.

  //remove all access from P4
  removed = P.removeByRole(roles[3]);
  // 1 + 3x3 + 3 + 3
  expect(P.size()).toBe(16);
  // All P4
  expect(removed).toBe(4);

  //repeated removal should yield 0
  removed = P.removeByRole(roles[3]);
  expect(P.size()).toBe(16); // No change.
  expect(removed).toBe(0); // None removed.
});
*/

test('Code coverage for `importMap`', () => {
  var P,
    childAction,
    childPerm,
    parentAction = { DELETE: true },
    parentPerm = {
      surname: 'Sergio',
    };
  function OffspringAction() {
    this['ALL'] = false;
  }
  function OffspringPerm() {
    this['*::*'] = new OffspringAction();
  }
  OffspringAction.prototype = parentAction;
  OffspringPerm.prototype = parentPerm;

  childPerm = new OffspringPerm();
  P = new perm.Permission();
  P.importMap(childPerm);
  expect(P.isDeniedAll('*', '*')).toBe(true);
});

describe('Key retrieval', () => {
  test('Empty ACL', () => {
    var P = new perm.Permission();
    var resourceKeys = P.getResourceKeys();
    expect(resourceKeys).toEqual([]);
    var roleKeys = P.getRoleKeys();
    expect(roleKeys).toEqual([]);
  });

  test('Single entry, all access', () => {
    var P = new perm.Permission(),
      res1 = 'RES1',
      rol1 = 'ROL1';

    P.allow(rol1, ASTERISK);
    expect(P.getRoleKeys()).toEqual([rol1]);
    expect(P.getResourceKeys()).toEqual([]);

    P.allow(ASTERISK, res1);
    expect(P.getRoleKeys()).toEqual([rol1]);
    expect(P.getResourceKeys()).toEqual([res1]);

    // Deny has the same result.
    P.deny(rol1, ASTERISK);
    expect(P.getRoleKeys()).toEqual([rol1]);
    expect(P.getResourceKeys()).toEqual([res1]);

    P.deny(ASTERISK, res1);
    expect(P.getRoleKeys()).toEqual([rol1]);
    expect(P.getResourceKeys()).toEqual([res1]);

    P = new perm.Permission();
    P.deny(ASTERISK, res1);
    expect(P.getRoleKeys()).toEqual([]);
    expect(P.getResourceKeys()).toEqual([res1]);

    P.deny(rol1, ASTERISK);
    expect(P.getRoleKeys()).toEqual([rol1]);
    expect(P.getResourceKeys()).toEqual([res1]);
  });

  test('Multiple entries', () => {
    var P,
      res1 = 'RES1',
      res2 = 'RES2',
      rol1 = 'ROL1',
      rol2 = 'ROL2';

    P = new perm.Permission();
    P.allow(rol1, res1);
    P.allow(rol1, res2);
    expect(P.getRoleKeys()).toEqual([rol1]);
    expect(P.getResourceKeys()).toEqual([res1, res2]);

    P.deny(rol2, res1);
    P.deny(rol2, res2);
    expect(P.getRoleKeys()).toEqual([rol1, rol2]);
    expect(P.getResourceKeys()).toEqual([res1, res2]);
  });

  test('Code coverage', () => {
    var P = new perm.Permission();
    expect(() => {
      P.separateKey('abc');
    }).toThrow(InvalidError);
  });
});
