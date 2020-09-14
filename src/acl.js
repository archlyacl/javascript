const { Types } = require('./permission');

const NON_EMPTY = '_reg_ registry is not empty';

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

Acl.prototype.allowAllResource = function (role) {
  try {
    this.roles.add(role);
  } catch (e) {
    //duplicate entry
    //do nothing
  }
  this.permissions.allow(role, '*');
};

Acl.prototype.allowAllRole = function (resource) {
  try {
    this.resources.add(resource);
  } catch (e) {
    //duplicate entry
    //do nothing
  }
  this.permissions.allow('*', resource);
};

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

Acl.prototype.clear = function () {
  this.permissions.clear();
  this.resources.clear();
  this.roles.clear();
};

Acl.prototype.denyAllResource = function (role) {
  try {
    this.roles.add(role);
  } catch (e) {
    //do nothing
  }
  this.permissions.deny(role, '*');
};

Acl.prototype.denyAllRole = function (resource) {
  try {
    this.resources.add(resource);
  } catch (e) {
    //do nothing
  }
  this.permissions.deny('*', resource);
};

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

Acl.prototype.exportPermissions = function () {
  return this.permissions.export();
};

Acl.prototype.exportResources = function () {
  return this.resources.exportRegistry();
};

Acl.prototype.exportRoles = function () {
  return this.roles.exportRegistry();
};

Acl.prototype.importPermissions = function (permissions) {
  if (this.permissions.size() !== 0) {
    throw new Error(NON_EMPTY.replace(/_reg_/, 'permissions'));
  }
  this.permissions.importMap(permissions);
};

Acl.prototype.importResources = function (resources) {
  if (this.resources.size() !== 0) {
    throw new Error(NON_EMPTY.replace(/_reg_/g, 'resources'));
  }
  this.resources.importRegistry(resources);
};

Acl.prototype.importRoles = function (roles) {
  if (this.roles.size() !== 0) {
    throw new Error(NON_EMPTY.replace(/_reg_/g, 'roles'));
  }
  this.roles.importRegistry(roles);
};

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

  //check role-resource
  for (r in rolePath) {
    if (rolePath.hasOwnProperty(r)) {
      aro = rolePath[r];
      for (c in resPath) {
        if (resPath.hasOwnProperty(c)) {
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
    }
  }

  return false;
};

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

  //check role-resource
  for (r in rolePath) {
    if (rolePath.hasOwnProperty(r)) {
      aro = rolePath[r];
      for (c in resPath) {
        if (resPath.hasOwnProperty(c)) {
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
    }
  }

  return false;
};

Acl.prototype.makeDefaultAllow = function () {
  this.permissions.makeDefaultAllow();
};

Acl.prototype.makeDefaultDeny = function () {
  this.permissions.makeDefaultDeny();
};

Acl.prototype.remove = function (role, resource, action) {
  this.permissions.remove(role, resource, action);
};

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

Acl.prototype.visualize = function () {
  var output = [];

  output.push(this.roles.toString());
  output.push('\n');
  output.push(this.resources.toString());
  output.push('\n');
  output.push(this.permissions.toString());
  output.push('\n');

  return output.join('');
};

Acl.prototype.visualizePermissions = function () {
  return this.permissions.toString();
};

Acl.prototype.visualizeResources = function () {
  return this.resources.display(null, null);
};

Acl.prototype.visualizeRoles = function () {
  return this.roles.display(null, null);
};

module.exports = Acl;
