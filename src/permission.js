/**
 * @module permission
 */

const common = require('./common');
const { InvalidError } = require('./error');

const PERM_NOT_FOUND = "Permission '_perm_' not found on '_role_' for '_res_'.";
const SEP = '::';

const Types = {
  ALL: 'ALL',
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
};

/**
 * The map of role-resource tuple to permissions.
 * The first level key is the tuple, the second level key is the action.
 * Available actions are "ALL", "CREATE", "READ", "UPDATE", "DELETE".
 *
 * An internal property `traceLevel` is initialized with value 0 (number). This number may be set to 1 or 2 (more detailed) to help with debugging permissions.
 * @name Permission
 * @constructor
 */
function Permission() {
  //map of string to map of string-bool
  this.perms = {};
  this.makeDefaultDeny();
  this.traceLevel = common.TRACE_LEVEL_0;
}

Permission.DEFAULT_KEY = common.ASTERISK + SEP + common.ASTERISK;

/**
 * Visualization of the permissions in tuples.
 */
Permission.prototype.toString = function () {
  var action,
    entry,
    tuple,
    out = ['Size: '];

  out.push(this.size());
  out.push('\n-------\n');

  for (tuple in this.perms) {
    out.push('- ');
    out.push(tuple);
    out.push('\n');
    entry = this.perms[tuple];
    for (action in entry) {
      out.push('\t');
      out.push(action);
      out.push('\t');
      out.push(entry[action]);
      out.push('\n');
    }
  }

  return out.join('');
};

/**
 * Grants action permission on resource to role.
 * Adds the action permission to any existing actions. Overrides the
 * existing action permission if any.
 *
 * @param {string} role - The ID of the access request object.
 * @param {string} resource - The ID of the access control object.
 * @param {string} [action=ALL] - The access action.
 */
Permission.prototype.allow = function (role, resource, action) {
  var roleValue = common.getValue(role),
    resValue = common.getValue(resource),
    perm,
    key = this.makeKey(roleValue, resValue);

  if (!action) {
    action = Types.ALL;
  }
  /* istanbul ignore next */
  if (this.traceLevel >= common.TRACE_LEVEL_3) {
    console.debug(
      'Grant resource "' +
        resValue +
        '" to role "' +
        roleValue +
        '" on action "' +
        action +
        '".'
    );
  }
  if (this.has(key)) {
    perm = this.perms[key];
    perm[action] = true;
    /* istanbul ignore next */
    if (this.traceLevel >= common.TRACE_LEVEL_4) {
      console.debug('Setting existing key "' + key + '":', perm);
    }
  } else {
    this.perms[key] = this.makePermission(action, true);
    /* istanbul ignore next */
    if (this.traceLevel >= common.TRACE_LEVEL_4) {
      console.debug('Setting new key "' + key + '":', this.perms[key]);
    }
  }
};

/**
 * Removes all permissions.
 */
Permission.prototype.clear = function () {
  this.perms = {};
};

/**
 * Denies action permission on resource to role.
 * Adds the action permission to any existing actions. Overrides the
 * existing action permission if any.
 *
 * @param {string} role - The ID of the access request object.
 * @param {string} resource - The ID of the access control object.
 * @param {string} [action=ALL] - The access action.
 */
Permission.prototype.deny = function (role, resource, action) {
  var roleValue = common.getValue(role),
    resValue = common.getValue(resource),
    perm,
    key = this.makeKey(roleValue, resValue);

  if (!action) {
    action = Types.ALL;
  }
  /* istanbul ignore next */
  if (this.traceLevel >= common.TRACE_LEVEL_3) {
    console.debug(
      'Deny resource "' +
        resValue +
        '" to role "' +
        roleValue +
        '" on action "' +
        action +
        '".'
    );
  }
  if (this.has(key)) {
    perm = this.perms[key];
    perm[action] = false;
    /* istanbul ignore next */
    if (this.traceLevel >= common.TRACE_LEVEL_4) {
      console.debug('Setting existing key "' + key + '":', perm);
    }
  } else {
    this.perms[key] = this.makePermission(action, false);
    /* istanbul ignore next */
    if (this.traceLevel >= common.TRACE_LEVEL_4) {
      console.debug('Setting new key "' + key + '":', this.perms[key]);
    }
  }
};

/**
 * Exports a snapshot of the permissions map.
 *
 * @return {Object} A map with string keys and map values where
 * the values are maps of string to boolean entries. Typically
 * meant for persistent storage.
 */
Permission.prototype.export = function () {
  var i,
    j,
    clone = {};

  for (i in this.perms) {
    clone[i] = {};
    for (j in this.perms[i]) {
      clone[i][j] = this.perms[i][j];
    }
  }

  return clone;
};

/**
 * Gets unique keys of resources.
 * @returns {string[]}
 */
Permission.prototype.getResourceKeys = function () {
  var i,
    resourceKeys = [],
    allKeys = this.separateKeys();
  for (i = 0; i < allKeys.resource.length; i++) {
    if (
      allKeys.resource[i] !== common.ASTERISK &&
      resourceKeys.indexOf(allKeys.resource[i]) === -1
    ) {
      resourceKeys.push(allKeys.resource[i]);
    }
  }
  return resourceKeys;
};

/**
 * Gets unique keys of roles.
 * @returns {string[]}
 */
Permission.prototype.getRoleKeys = function () {
  var i,
    roleKeys = [],
    allKeys = this.separateKeys();
  for (i = 0; i < allKeys.role.length; i++) {
    if (
      allKeys.role[i] !== common.ASTERISK &&
      roleKeys.indexOf(allKeys.role[i]) === -1
    ) {
      roleKeys.push(allKeys.role[i]);
    }
  }
  return roleKeys;
};

/**
 * Determines if the role-resource tuple is available.
 *
 * @param {string} key - The tuple of role and resource.
 * @return {Boolean} Returns true if the permission is available for this tuple.
 */
Permission.prototype.has = function (key) {
  return this.perms.hasOwnProperty(key);
};

/**
 * Re-creates the permission map with a new of permissions.
 *
 * @param {Object} map - The map of string-string-boolean
 * tuples. The first-level string is a permission key
 * (<aco>::<aro>); the second-level string is the set of
 * actions; the boolean value indicates whether the permission
 * is explicitly granted/denied.
 */
Permission.prototype.importMap = function (map) {
  var i, j;

  this.perms = {};
  for (i in map) {
    if (map.hasOwnProperty(i)) {
      this.perms[i] = {};
      for (j in map[i]) {
        if (map[i].hasOwnProperty(j)) {
          this.perms[i][j] = map[i][j];
        }
      }
    }
  }
};

/**
 * Determines if the role has access on the resource.
 *
 * @param {string} role - The ID of the access request object.
 * @param {string} resource - The ID of the access control object.
 * @return {Boolean} Returns true only if the role has been
 * explicitly given access to all actions on the resource.
 * Returns false if the role has been explicitly denied access.
 * Returns null otherwise.
 */
Permission.prototype.isAllowedAll = function (role, resource) {
  var k,
    perm,
    allSet = 0,
    resId,
    roleId,
    key;

  resId = resource ? common.getValue(resource) : common.ASTERISK;
  roleId = role ? common.getValue(role) : common.ASTERISK;
  key = this.makeKey(roleId, resId);

  if (!this.has(key)) {
    /* istanbul ignore next */
    if (this.traceLevel >= common.TRACE_LEVEL_2) {
      console.debug(
        'Key "' +
          key +
          '" not in permissions register for isAllowedAll - returns NULL.'
      );
    }
    return null;
  }

  perm = this.perms[key];
  for (k in perm) {
    if (perm[k] === false) {
      /* istanbul ignore next */
      if (this.traceLevel >= common.TRACE_LEVEL_2) {
        console.debug(
          'Permission "' +
            k +
            '" on key "' +
            key +
            '" is false - returns false for isAllowedAll.'
        );
      }
      return false;
    }
    if (k !== Types.ALL) {
      allSet++;
    }
  }
  if (perm.hasOwnProperty(Types.ALL)) {
    /* istanbul ignore next */
    if (this.traceLevel >= common.TRACE_LEVEL_2) {
      console.debug(
        'Permission "' +
          Types.ALL +
          '" on key "' +
          key +
          '" is present - returns true for isAllowedAll.'
      );
    }
    return true; //true because ALL=false would be caught in the loop
  }

  if (allSet === 4) {
    /* istanbul ignore next */
    if (this.traceLevel >= common.TRACE_LEVEL_2) {
      console.debug(
        'All 4 permissions on key "' +
          key +
          '" are non-false - returns true for isAllowedAll.'
      );
    }
    return true;
  }

  /* istanbul ignore next */
  if (this.traceLevel >= common.TRACE_LEVEL_2) {
    console.debug(
      'Unexpected number of permissions on key "' +
        key +
        '" encountered - returns NULL for isAllowedAll.'
    );
  }
  return null;
};

/**
 * Determines if the role has access on the resource for the specific action.
 * The permission on the specific action is evaluated to see if it has been
 * specified. If not specified, the permission on the <code>ALL</code>
 * permission is evaluated. If both are not specified, <code>null</code> is
 * returned.
 *
 * @param {string} role - The ID of the access request object.
 * @param {string} resource - The ID of the access control object.
 * @param {string} action - The access action.
 * @return {Boolean} Returns true if the role has access to the specified
 * action on the resource. Returns false if the role is denied
 * access. Returns null if no permission is specified.
 */
Permission.prototype.isAllowed = function (role, resource, action) {
  var perm, resId, roleId, key;

  resId = resource ? common.getValue(resource) : common.ASTERISK;
  roleId = role ? common.getValue(role) : common.ASTERISK;
  key = this.makeKey(roleId, resId);

  if (!this.has(key)) {
    /* istanbul ignore next */
    if (this.traceLevel >= common.TRACE_LEVEL_2) {
      console.debug(
        'Key "' +
          key +
          '" not in permissions register for isAllowed on "' +
          action +
          '" - returns NULL.'
      );
    }
    return null;
  }

  perm = this.perms[key];
  if (perm[action] === undefined) {
    //if specific action is not present, check for ALL
    if (perm[Types.ALL] === undefined) {
      /* istanbul ignore next */
      if (this.traceLevel >= common.TRACE_LEVEL_2) {
        console.debug(
          'Permission "' +
            action +
            '" and "' +
            Types.ALL +
            '" on key "' +
            key +
            '" are undefined - returns NULL for isAllowed.'
        );
      }
      return null;
    }

    /* istanbul ignore next */
    if (this.traceLevel >= common.TRACE_LEVEL_2) {
      console.debug(
        'Permission "' +
          action +
          '" on key "' +
          key +
          '" is undefined - returns `' +
          perm[Types.ALL] +
          '` for isAllowed.'
      );
    }
    return perm[Types.ALL];
  } //else specific action is present

  /* istanbul ignore next */
  if (this.traceLevel >= common.TRACE_LEVEL_2) {
    console.debug(
      'Returns `' +
        perm[action] +
        '` on key "' +
        key +
        '" for isAllowed on "' +
        action +
        '".'
    );
  }
  return perm[action];
};

/**
 * Determines if the role is denied access on the resource.
 *
 * @param {string} role - The ID of the access request object.
 * @param {string} resource - The ID of the access control object.
 * @return {Boolean} Returns true only if the role has been
 * explicitly denied access to all actions on the resource.
 * Returns false if the role has been explicitly granted access.
 * Returns null otherwise.
 */
Permission.prototype.isDeniedAll = function (role, resource) {
  var k,
    perm,
    allSet = 0,
    resId,
    roleId,
    key;

  resId = resource ? common.getValue(resource) : common.ASTERISK;
  roleId = role ? common.getValue(role) : common.ASTERISK;
  key = this.makeKey(roleId, resId);

  if (!this.has(key)) {
    /* istanbul ignore next */
    if (this.traceLevel >= common.TRACE_LEVEL_2) {
      console.debug(
        'Key "' +
          key +
          '" not in permissions register for isDeniedAll - returns NULL.'
      );
    }
    return null;
  }

  perm = this.perms[key];
  for (k in perm) {
    //if any entry is true, resource is NOT denied
    if (perm[k]) {
      /* istanbul ignore next */
      if (this.traceLevel >= common.TRACE_LEVEL_2) {
        console.debug(
          'Permission "' +
            k +
            '" on key "' +
            key +
            '" is true - returns false for isDeniedAll.'
        );
      }
      return false;
    }
    if (k !== Types.ALL) {
      allSet++;
    }
  }
  if (perm.hasOwnProperty(Types.ALL)) {
    /* istanbul ignore next */
    if (this.traceLevel >= common.TRACE_LEVEL_2) {
      console.debug(
        'Permission "' +
          Types.ALL +
          '" on key "' +
          key +
          '" is present with non-true value - returns true for isDeniedAll.'
      );
    }
    return true; //true because ALL=true would be caught in the loop
  }

  if (allSet === 4) {
    /* istanbul ignore next */
    if (this.traceLevel >= common.TRACE_LEVEL_2) {
      console.debug(
        'All 4 permissions on key "' +
          key +
          '" are non-true - returns true for isDeniedAll.'
      );
    }
    return true;
  }

  /* istanbul ignore next */
  if (this.traceLevel >= common.TRACE_LEVEL_2) {
    console.debug(
      'Unexpected number of permissions on key "' +
        key +
        '" encountered - returns NULL for isDeniedAll.'
    );
  }
  return null;
};

/**
 * Determines if the role is denied access on the resource for the specific
 * action.
 * The permission on the specific action is evaluated to see if it has been
 * specified. If not specified, the permission on the <code>ALL</code>
 * permission is evaluated. If both are not specified, <code>null</code> is
 * returned.
 *
 * @param {string} role - The ID of the access request object.
 * @param {string} resource - The ID of the access control object.
 * @param {string} action - The access action.
 * @return {Boolean} Returns true if the role is denied access
 * to the specified action on the resource. Returns false if the
 * role has access. Returns null if no permission is specified.
 */
Permission.prototype.isDenied = function (role, resource, action) {
  var perm, resId, roleId, key;

  resId = resource ? common.getValue(resource) : common.ASTERISK;
  roleId = role ? common.getValue(role) : common.ASTERISK;
  key = this.makeKey(roleId, resId);

  if (!this.has(key)) {
    /* istanbul ignore next */
    if (this.traceLevel >= common.TRACE_LEVEL_2) {
      console.debug(
        'Key "' +
          key +
          '" not in permissions register for isDenied on "' +
          action +
          '" - returns NULL.'
      );
    }
    return null;
  }

  perm = this.perms[key];
  if (perm[action] === undefined) {
    //if specific action is not present, check for ALL
    if (perm[Types.ALL] === undefined) {
      /* istanbul ignore next */
      if (this.traceLevel >= common.TRACE_LEVEL_2) {
        console.debug(
          'Permission "' +
            action +
            '" and "' +
            Types.ALL +
            '" on key "' +
            key +
            '" are undefined - returns NULL for isDenied.'
        );
      }
      return null;
    }

    /* istanbul ignore next */
    if (this.traceLevel >= common.TRACE_LEVEL_2) {
      console.debug(
        'Permission "' +
          action +
          '" on key "' +
          key +
          '" is undefined - returns `' +
          !perm[Types.ALL] +
          '` for isDenied.'
      );
    }
    return !perm[Types.ALL];
  } //else specific action is present

  /* istanbul ignore next */
  if (this.traceLevel >= common.TRACE_LEVEL_2) {
    console.debug(
      'Returns `' +
        !perm[action] +
        '` on key "' +
        key +
        '" for isDenied on "' +
        action +
        '".'
    );
  }
  return !perm[action];
};

/**
 * Makes the default permission allow.
 */
Permission.prototype.makeDefaultAllow = function () {
  this.perms[Permission.DEFAULT_KEY] = this.makePermission(Types.ALL, true);
};

/**
 * Makes the default permission deny.
 */
Permission.prototype.makeDefaultDeny = function () {
  this.perms[Permission.DEFAULT_KEY] = this.makePermission(Types.ALL, false);
};

/**
 * Removes the specified permission on resource from role.
 *
 * @param {string} role - The ID of the access request object.
 * @param {string} resource - The ID of the access control object.
 * @param {string} [action=ALL] - The access action.
 * @throws Will throw an error if the permission is not available.
 */
Permission.prototype.remove = function (role, resource, action) {
  var orig,
    perm,
    type,
    resId = common.getValue(resource),
    roleId = common.getValue(role),
    key = this.makeKey(roleId, resId);

  if (!action) {
    action = Types.ALL;
  }
  if (!this.has(key)) {
    throw new Error(
      PERM_NOT_FOUND.replace(/_perm_/g, key)
        .replace(/_res_/g, resId)
        .replace(/_role_/g, roleId)
    );
  }
  perm = this.perms[key];
  if (perm[action] !== undefined) {
    //i.e. if action is defined
    if (action === Types.ALL) {
      delete this.perms[key];

      return;
    } else {
      //remove specific action
      delete perm[action];
    }
  } else if (perm[Types.ALL] !== undefined) {
    //has ALL - remove and put in the others
    orig = perm[Types.ALL];
    delete perm[Types.ALL];

    for (type in Types) {
      if (type !== action && type !== Types.ALL) {
        perm[type] = orig;
      }
    }
  } else if (action === Types.ALL) {
    delete this.perms[key];

    return;
  } else {
    //i.e. action is not defined
    throw new Error(
      PERM_NOT_FOUND.replace(/_perm_/g, action)
        .replace(/_res_/g, resId)
        .replace(/_role_/g, roleId)
    );
  }

  if (Object.keys(perm).length === 0) {
    delete this.perms[key];
  } else {
    this.perms[key] = perm;
  }
};

/**
 * Removes all permissions related to the resource.
 *
 * @param {string} resourceId - The ID of the resource to remove.
 * @return {Number} The number of removed permissions.
 */
Permission.prototype.removeByResource = function (resourceId) {
  var key,
    toRemove = [],
    resId = SEP + resourceId;

  for (key in this.perms) {
    if (key.endsWith(resId)) {
      toRemove.push(key);
    }
  }

  return _remove(this.perms, toRemove);
};

/**
 * Removes all permissions related to the role.
 *
 * @param {string} roleId - The ID of the role to remove.
 * @return {Number} The number of removed permissions.
 */
Permission.prototype.removeByRole = function (roleId) {
  var key,
    toRemove = [],
    rolId = roleId + SEP;

  for (key in this.perms) {
    if (key.startsWith(rolId)) {
      toRemove.push(key);
    }
  }

  return _remove(this.perms, toRemove);
};

/**
 * The number of specified permissions.
 *
 * @return {Number} The number of permissions in the registry.
 */
Permission.prototype.size = function () {
  return Object.keys(this.perms).length;
};

/**
 * Creates the key in the form "<aro>::<aco>" where "<aro>" is
 * the ID of the role, and "<aco>" is the ID of the resource.
 *
 * @param {string} role The ID of the role.
 * @param {string} resource The ID of the resource.
 * @return {string} The key of the permission.
 */
Permission.prototype.makeKey = function (role, resource) {
  var aco = resource ? resource : common.ASTERISK,
    aro = role ? role : common.ASTERISK;

  return aro + SEP + aco;
};

/**
 * Creates a permissions map.
 *
 * @param {string} action The action to set. Accepted values are
 * "ALL", "CREATE", "READ", "UPDATE", "DELETE".
 * @param {Boolean} allow Either true or false to grant or deny access.
 * @return {Object} The map of string-boolean values.
 */
Permission.prototype.makePermission = function (action, allow) {
  var perm = {};

  perm[action] = allow;

  return perm;
};

/**
 * Separates the key into its component identifiers.
 * @param {string} key - The key to separate into role and resource identifiers.
 * @returns {string[]} A 2-celled array with the role identifier in position 0 and resource identifier in position 1.
 * @throws {InvalidError} Throws this error if the key is malformed.
 */
Permission.prototype.separateKey = function (key) {
  var parts = key.split(SEP);
  if (parts.length !== 2) {
    throw new InvalidError(
      'key',
      `Must have the form "{string}${SEP}{string}"`
    );
  }
  return parts;
};

/**
 * Separates the keys in the permissions.
 * @returns {Object} Returns an object with the properties `resource` and `role` both of which are arrays of IDs.
 * @throws {InvalidError} Throws this error from `separateKey` if any of the keys is malformed.
 */
Permission.prototype.separateKeys = function () {
  var i,
    parts,
    allKeys = {
      resource: [],
      role: [],
    },
    keys = Object.keys(this.perms);
  for (i = 0; i < keys.length; i++) {
    parts = this.separateKey(keys[i]);
    allKeys.resource.push(parts[1]);
    allKeys.role.push(parts[0]);
  }
  return allKeys;
};

/**
 * Helper function called by remove functions to remove permissions.
 * @param {Object} perms - The map of permissions - Permission.perms.
 * @param {string[]} keys - The array of keys to remove from the permission.
 * @return {Number} Returns the number of removed permissions.
 */
function _remove(perms, keys) {
  var i,
    removed = 0;

  for (i = 0; i < keys.length; i++) {
    delete perms[keys[i]];
    removed++;
  }

  return removed;
}

module.exports = {
  Permission,
  SEP,
  Types,
};
