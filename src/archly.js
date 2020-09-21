const Acl = require('./acl');
const { Permission, Types } = require('./permission');
const Registry = require('./registry');

function newAcl() {
  var roles = new Registry(),
    resources = new Registry(),
    permissions = new Permission();

  return new Acl(permissions, resources, roles);
}

const VERSION = '1.0.0';

module.exports = {
  newAcl,
  Types,
  VERSION,
};
