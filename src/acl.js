/**
 * @module acl
 */

const common = require('./common');
const { Types } = require('./permission');

const _NON_EMPTY = '_reg_ registry is not empty';

/**
 * The Acl class for managing permissions.
 * @constructor
 * @param {Permission} perms
 * @param {Registry} resourceReg
 * @param {Registry} roleReg
 */
function Acl(perms, resourceReg, roleReg) {
  this.permissions = perms;
  this.resources = resourceReg;
  this.roles = roleReg;
}

/**
 * Adds a resource to the registry.
 * @param {string|Object} resource
 * @param {string|Object} parent - The parent resource to add the resource under.
 */
Acl.prototype.addResource = function (resource, parent) {
  this.resources.add(resource, parent);
};

/**
 * Adds a role to the registry.
 * @param {string|Object} role
 * @param {string|Object} parent - The parent role to add the role under. Optional.
 */
Acl.prototype.addRole = function (role, parent) {
  this.roles.add(role, parent);
};

/**
 * Grants access to the supplied role on all resources.
 * @param {string|Object} role
 */
Acl.prototype.allowAllResource = function (role) {
  try {
    this.roles.add(role);
  } catch (e) {
    //duplicate entry
    //do nothing
  }
  this.permissions.allow(role, common.ASTERISK);
};

/**
 * Grants access to all roles on the supplied resource.
 * @param {string|Object} resource
 */
Acl.prototype.allowAllRole = function (resource) {
  try {
    this.resources.add(resource);
  } catch (e) {
    //duplicate entry
    //do nothing
  }
  this.permissions.allow(common.ASTERISK, resource);
};

/**
 * Grants access to the supplied role on the supplied resource.
 * @param {string|Object} role
 * @param {string|Object} resource
 * @param {string} [action]
 */
Acl.prototype.allow = function (role, resource, action) {
  try {
    this.roles.add(role);
  } catch (e) {
    //do nothing
  }
  try {
    this.resources.add(resource);
  } catch (e) {
    //do nothing
  }
  this.permissions.allow(role, resource, action);
};

/**
 * Clears the values completely.
 */
Acl.prototype.clear = function () {
  this.permissions.clear();
  this.resources.clear();
  this.roles.clear();
};

/**
 * Denies access to the supplied role on all resources.
 * @param {string|Object} role
 */
Acl.prototype.denyAllResource = function (role) {
  try {
    this.roles.add(role);
  } catch (e) {
    //do nothing
  }
  this.permissions.deny(role, common.ASTERISK);
};

/**
 * Denies access to all roles on the supplied resource.
 * @param {string|Object} resource
 */
Acl.prototype.denyAllRole = function (resource) {
  try {
    this.resources.add(resource);
  } catch (e) {
    //do nothing
  }
  this.permissions.deny(common.ASTERISK, resource);
};

/**
 * Denies access to the supplied role
 * @param {string|Object} role
 * @param {string|Object} resource
 * @param {string} [action]
 */
Acl.prototype.deny = function (role, resource, action) {
  try {
    this.roles.add(role);
  } catch (e) {
    //do nothing
  }
  try {
    this.resources.add(resource);
  } catch (e) {
    //do nothing
  }
  this.permissions.deny(role, resource, action);
};

/**
 * Exports an object containing the keys `permission`, `resources` and `roles`.
 *
 * @return {Object}
 */
Acl.prototype.exportAll = function () {
  return {
    permissions: this.permissions.export(),
    resources: this.resources.export(),
    roles: this.roles.export(),
  };
};

/**
 * Exports a string-string key-value map.
 *
 * @return {Object}
 */
Acl.prototype.exportPermissions = function () {
  return this.permissions.export();
};

/**
 * Exports the registry holding the resources hierarchy and object instances.
 *
 * @return {Object} A map containing `records` and `registry` as the keys.
 */
Acl.prototype.exportResources = function () {
  return this.resources.export();
};

/**
 * Exports the registry holding the roles hierarchy and object instances.
 *
 * @return {Object} A map containing `records` and `regsitry` as the keys.
 */
Acl.prototype.exportRoles = function () {
  return this.roles.export();
};

/**
 * Checks the permissions against the roles and resources registries to determine if there are permissions for which there are no roles/resources.
 * @returns {Object|null} A map with the keys `resource` and `role`, both of which are string arrays. If the permissions record is empty, returns null instead.
 */
Acl.prototype.getOrphanPermissions = function () {
  var i,
    resourceKeys,
    roleKeys,
    orphan = {
      resource: [],
      role: [],
    };
  if (this.permissions.size() === 0) {
    return null;
  }
  resourceKeys = this.permissions.getResourceKeys();
  for (i = 0; i < resourceKeys.length; i++) {
    if (!this.resources.has(resourceKeys[i])) {
      orphan.resource.push(resourceKeys[i]);
    }
  }
  roleKeys = this.permissions.getRoleKeys();
  for (i = 0; i < roleKeys.length; i++) {
    if (!this.roles.has(roleKeys[i])) {
      orphan.role.push(roleKeys[i]);
    }
  }
  return orphan;
};

/**
 * Gets the object instance as stored in the registry.
 * @param {string|Object} entry
 * @returns {mixed}
 */
Acl.prototype.getResource = function (entry) {
  return this.resources.getRecord(entry);
};

/**
 * Gets the object instance as stored in the registry.
 * @param {string|Object} entry
 * @returns {mixed}
 */
Acl.prototype.getRole = function (entry) {
  return this.roles.getRecord(entry);
};

/**
 * Checks whether there are permissions for which there are no entries in either the roles or resources registries.
 *
 * @returns {boolean} Returns true if there are any orphan entries. False otherwise, including if the permissions records are empty.
 */
Acl.prototype.hasOrphanPermissions = function () {
  var orphan = this.getOrphanPermissions();
  if (orphan === null) {
    return false;
  }
  if (Object.keys(orphan.resource).length > 0) {
    return true;
  }
  if (Object.keys(orphan.role).length > 0) {
    return true;
  }
  return false;
};

/**
 * Imports the exported object containing the keys `permission`, `resources` and `roles`.
 *
 * @param {Ojbect} acl - The exported ACL object.
 * @param {function} [roleClass] - The constructor/function for instantiating entries in the role registry.
 * @param {function} [resourceClass] - The constructor/function for instantiating entries in the resource registry.
 */
Acl.prototype.importAll = function (acl, roleClass, resourceClass) {
  this.importPermissions(acl.permissions);
  this.importResources(acl.resources, resourceClass);
  this.importRoles(acl.roles, roleClass);
};

/**
 * Imports a string-string key-value map representing the permissions.
 *
 * @param {Object} permissions
 */
Acl.prototype.importPermissions = function (permissions) {
  if (this.permissions.size() !== 0) {
    throw new Error(_NON_EMPTY.replace(/_reg_/, 'permissions'));
  }
  this.permissions.importMap(permissions);
};

/**
 * Imports the registry holding the resources hierarchy and object instances.
 *
 * @param {Object} resources - A map containing `records` and `registry` as the keys.
 * @param {function} [resourceClass] - The constructor/function for instantiating the values. Optional.
 */
Acl.prototype.importResources = function (resources, resourceClass) {
  if (this.resources.size() !== 0) {
    throw new Error(_NON_EMPTY.replace(/_reg_/g, 'resources'));
  }
  this.resources.import(resources, resourceClass);
};

/**
 * Imports the  registry holding the roles hierarchy and object instances.
 *
 * @param {Object} roles - A map containing `records` and `registry` as the keys.
 * @param {function} [roleClass] - The constructor/function for instantiating the values. Optional.
 */
Acl.prototype.importRoles = function (roles, roleClass) {
  if (this.roles.size() !== 0) {
    throw new Error(_NON_EMPTY.replace(/_reg_/g, 'roles'));
  }
  this.roles.import(roles, roleClass);
};

/**
 * Checks if a role has access to a resource.
 *
 * @param {string|Object} role
 * @param {string|Object} resource
 * @param {string} [action] - The action to check access for. Optional. Default [Types.ALL]{@link module:permission#Types}
 * @returns {boolean}
 */
Acl.prototype.isAllowed = function (role, resource, action) {
  var aco,
    aro,
    c,
    grant,
    r,
    resPath = this.resources.traverseRoot(resource),
    rolePath = this.roles.traverseRoot(role);

  if (!action) {
    action = Types.ALL;
  }

  /* istanbul ignore next */
  if (this.permissions.traceLevel >= common.TRACE_LEVEL_1) {
    console.debug('isAllowed - Resource path to root:', resPath);
    console.debug('isAllowed - Role path to root:', rolePath);
  }

  //check role-resource
  for (r in rolePath) {
    aro = rolePath[r];
    for (c in resPath) {
      aco = resPath[c];
      if (action === Types.ALL) {
        grant = this.permissions.isAllowedAll(aro, aco);
      } else {
        grant = this.permissions.isAllowed(aro, aco, action);
      }

      if (grant !== null) {
        return grant;
      } //else null, continue
    }
  }

  return false;
};

/**
 * Checks if a role has explicit access to a resource.
 *
 * This method does not recursively check for access up the tree.
 *
 * @param {string|Object} role
 * @param {string|Object} resource
 * @param {string} [action] - The action to check access for. Optional. Default [Types.ALL]{@link module:permission#Types}
 * @returns {boolean}
 */
Acl.prototype.isAllowedStrict = function (role, resource, action) {
  if (!action) {
    action = Types.ALL;
  }
  /* istanbul ignore next */
  if (this.permissions.traceLevel >= common.TRACE_LEVEL_1) {
    console.debug('isAllowedStrict - role:', role, 'resource:', resource);
  }
  if (action === Types.ALL) {
    if (this.permissions.isAllowedAll(role, resource)) {
      return true;
    }
  } else {
    if (this.permissions.isAllowed(role, resource, action)) {
      return true;
    }
  }
  return false;
};

/**
 * Checks if a role is denied access to a resource.
 *
 * @param {string|Object} role
 * @param {string|Object} resource
 * @param {string} [action] - The action to check access for. Optional. Default [Types.ALL]{@link module:permission#Types}
 * @returns {boolean}
 */
Acl.prototype.isDenied = function (role, resource, action) {
  var aco,
    aro,
    c,
    grant,
    r,
    resPath = this.resources.traverseRoot(resource),
    rolePath = this.roles.traverseRoot(role);

  if (!action) {
    action = Types.ALL;
  }

  /* istanbul ignore next */
  if (this.permissions.traceLevel >= common.TRACE_LEVEL_1) {
    console.debug('isDenied - Resource path to root:', resPath);
    console.debug('isDenied - Role path to root:', rolePath);
  }

  //check role-resource
  for (r in rolePath) {
    aro = rolePath[r];
    for (c in resPath) {
      aco = resPath[c];
      if (action === Types.ALL) {
        grant = this.permissions.isDeniedAll(aro, aco);
      } else {
        grant = this.permissions.isDenied(aro, aco, action);
      }

      if (grant !== null) {
        return grant;
      } //else null, continue
    }
  }

  return false;
};

/**
 * Checks if a role is explicitly denied access to a resource.
 *
 * This method does not recursively check for deny access up the tree.
 *
 * @param {string|Object} role
 * @param {string|Object} resource
 * @param {string} [action] - The action to check access for. Optional. Default [Types.ALL]{@link module:permission#Types}
 * @returns {boolean}
 */
Acl.prototype.isDeniedStrict = function (role, resource, action) {
  if (!action) {
    action = Types.ALL;
  }
  /* istanbul ignore next */
  if (this.permissions.traceLevel >= common.TRACE_LEVEL_1) {
    console.debug('isAllowedStrict - role:', role, 'resource:', resource);
  }
  if (action === Types.ALL) {
    if (this.permissions.isDeniedAll(role, resource)) {
      return true;
    }
  } else {
    if (this.permissions.isDenied(role, resource, action)) {
      return true;
    }
  }
  return false;
};

/**
 * Sets the default permission scope to allow.
 */
Acl.prototype.makeDefaultAllow = function () {
  this.permissions.makeDefaultAllow();
};

/**
 * Sets the default permission scope to deny.
 */
Acl.prototype.makeDefaultDeny = function () {
  this.permissions.makeDefaultDeny();
};

/**
 * Removes the permission from the specified role on the specified resource.
 *
 * @param {string|Object} role
 * @param {string|Object} resource
 * @param {string} [action] - The action to remove access for. Optional.
 */
Acl.prototype.remove = function (role, resource, action) {
  this.permissions.remove(role, resource, action);
};

/**
 * Removes the resource and associated permissions.
 *
 * @param {string|Object} resource
 * @param {boolean} removeDescendants - Whether to remove child entries and their descendants as well.
 */
Acl.prototype.removeResource = function (resource, removeDescendants) {
  var i, resources;

  if (resource === null) {
    throw new Error('Cannot remove null resource');
  }
  resources = this.resources.remove(resource, removeDescendants);
  for (i = 0; i < resources.length; i++) {
    this.permissions.removeByResource(resources[i]);
  }
};

/**
 * Removes the role and associated permissions.
 *
 * @param {string|Object} role
 * @param {boolean} removeDescendants - Whether to remove all child entries and their descendants as well.
 */
Acl.prototype.removeRole = function (role, removeDescendants) {
  var i, roles;

  if (role === null) {
    throw new Error('Cannot remove null role');
  }
  roles = this.roles.remove(role, removeDescendants);
  for (i = 0; i < roles.length; i++) {
    this.permissions.removeByRole(roles[i]);
  }
};

/**
 * Turns debugging off.
 */
Acl.prototype.setTraceLevel0 = function () {
  this.permissions.traceLevel = common.TRACE_LEVEL_0;
};

/**
 * Turns debugging to level 1.
 * Shows the path of the resource and role in their respective registries.
 */
Acl.prototype.setTraceLevel1 = function () {
  this.permissions.traceLevel = common.TRACE_LEVEL_1;
};

/**
 * Turns debugging to level 2.
 * In addition to showing the trace in level 1, level 2 also shows the evaluation of permissions within the permissions register.
 */
Acl.prototype.setTraceLevel2 = function () {
  this.permissions.traceLevel = common.TRACE_LEVEL_2;
};

/**
 * Turns debugging to level 3.
 * In addition to showing the evaluation in level 2, level 3 also shows the setting of permissions.
 */
Acl.prototype.setTraceLevel3 = function () {
  this.permissions.traceLevel = common.TRACE_LEVEL_3;
};

/**
 * Turns debugging to level 4.
 * In addition to showingthe setting of permissions, level 4 details whether permissions affected are new or existing ones.
 */
Acl.prototype.setTraceLevel4 = function () {
  this.permissions.traceLevel = common.TRACE_LEVEL_4;
};

/**
 * Joins the `toString` outputs of the roles, resources and permissions into one.
 *
 * @returns {string}
 */
Acl.prototype.toString = function () {
  var output = [];

  output.push(this.roles.toString());
  output.push('\n');
  output.push(this.resources.toString());
  output.push('\n');
  output.push(this.permissions.toString());
  output.push('\n');

  return output.join('');
};

/**
 * Returns the visual representation of the permissions in text form.
 * @returns {string}
 */
Acl.prototype.visualizePermissions = function () {
  return this.permissions.toString();
};

/**
 * Returns the visual representation of the resources in text form.
 * @returns {string}
 */
Acl.prototype.visualizeResources = function () {
  return this.resources.display();
};

/**
 * Returns the visual representation of the roles in text form.
 * @returns {string}
 */
Acl.prototype.visualizeRoles = function () {
  return this.roles.display();
};

module.exports = Acl;
