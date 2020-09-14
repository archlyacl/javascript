const { getValue } = require('./common');
const { DuplicateError, NotFoundError } = require('./error');

/**
 * The registry for resources and roles.
 *
 * Contains `registry` to hold the hierarchy relationship and `records` to hold the original object information.
 *
 * Note that `records` is not used in the evaluation of the access permissions.
 * @constructor
 */
function Registry() {
  this.records = {};
  this.registry = {};
}

/**
 * Prints the traversal path from the entry to the root.
 *
 * @param {array} path - The list representing the path.
 */
Registry.display = function (path) {
  var i,
    out = '-';

  for (i in path) {
    out += ' -> ';
    out += path[i];
  }
  out += ' <';

  return out;
};

/**
 * Adds an entry to the registry.
 *
 * @param {string|Object} entry - The entry to add.
 * @param {string|Object} [parent] - The parent entry under which to
 * place the child entry.
 * @throws Will throw an error if the entry is already in the
 * registry or if the parent is not in the registry.
 */
Registry.prototype.add = function (entry, parent) {
  var _entry = getValue(entry);
  if (this.has(_entry)) {
    throw new DuplicateError(_entry);
  }
  if (parent) {
    parent = getValue(parent);
    if (!this.has(parent)) {
      throw new NotFoundError(parent);
    }
    this.registry[_entry] = parent;
  } else {
    this.registry[_entry] = '';
  }
  this.records[_entry] = entry;
};

/**
 * Empties the registry.
 */
Registry.prototype.clear = function () {
  this.records = {};
  this.registry = {};
};

/**
 * Clones the registry to export.
 *
 * @return {object} A clone of the registry and records.
 */
Registry.prototype.exportRegistry = function () {
  var i,
    _records = {},
    _registry = {};

  for (i in this.records) {
    if (typeof this.records[i] === 'object') {
      _records[i] = Object.assign({}, this.records[i]);
    } else {
      _records[i] = this.records[i];
    }
  }
  for (i in this.registry) {
    _registry[i] = this.registry[i];
  }

  return {
    records: _records,
    registry: _registry,
  };
};

/**
 * Checks if the entry is stored in the registry.
 *
 * @param {AclEntry} entry - The entry to check.
 * @return {boolean} True if the ID of the entry is present in
 * the registry.
 */
Registry.prototype.has = function (entry) {
  var _entry = getValue(entry);
  return this.registry[_entry] !== undefined;
};

/**
 * Checks if there are children IDs under the specified ID.
 *
 * @param {string} parentId - The ID of the parent to check for.
 * @return {boolean} True if there is at least one child ID.
 */
Registry.prototype.hasChild = function (parentId) {
  for (var i in this.registry) {
    if (this.registry[i] === parentId) {
      return true;
    }
  }

  return false;
};

/**
 * Re-creates the registry with a new hierarchy.
 *
 * The existing `registry` and `records` properties are instantiated to new objects right before the import.
 *
 * @param {object} stored - The object with the keys `registry` and `records`. If the keys are not present, this is essentially a clear operation for the missing property.
 * @param {function} instantiator - The constructor/function for instantiating the values in `records`. Optional.
 */
Registry.prototype.importRegistry = function (stored, instantiator) {
  var i,
    hasClass = typeof instantiator === 'function';

  this.registry = {};
  if (typeof stored.registry === 'object') {
    for (i in stored.registry) {
      this.registry[i] = stored.registry[i];
    }
  }
  this.records = {};
  if (typeof stored.records === 'object') {
    for (i in stored.records) {
      if (hasClass) {
        this.records[i] = new instantiator(stored.records[i]);
      } else {
        this.records[i] = stored.records[i];
      }
    }
  }
};

/**
 * Creates a traversal path from the entry to the root.
 *
 * @param {AclEntry} entry - The ID of the entry to start
 * traversing from.
 * @return {array} A list of entry IDs starting from the entry and
 * ending with the root.
 */
Registry.prototype.traverseRoot = function (entry) {
  var eId,
    path = [];

  entry = getValue(entry);
  if (entry == null) {
    path.push('*');

    return path;
  }

  eId = entry;

  while (this.registry[eId] !== undefined) {
    path.push(eId);
    eId = this.registry[eId];
  }
  path.push('*');

  return path;
};

/**
 * Prints a cascading list of entries in this registry.
 *
 * @param {string} leading - The leading space for indented entries.
 * @param {string} entryId - The ID of the entry to start traversing from.
 * @return {string} The string representing the parent-child
 * relationships between the entries.
 */
Registry.prototype.display = function (leading, entryId) {
  var tis = this,
    childIds,
    output = [];

  if (!leading) {
    leading = '';
  }
  if (!entryId) {
    entryId = '';
  }

  childIds = findChildren(this.registry, entryId);
  childIds.forEach(function (childId) {
    var entry = tis.records[childId];
    if (!entry) {
      entry = childId;
    }
    output.push(leading);
    output.push('- ');
    output.push(entry.toString());
    output.push('\n');
    output.push(tis.display(' ' + leading, childId));
  });

  return output.join('');
};

/**
 * Removes an entry from the registry.
 *
 * @param {AclEntry} entry - The entry to remove from the registry.
 * @param {boolean} removeDescendants - If true, all child
 * entries and descendants are removed as well.
 * @throws Will throw an error if the entry or any of the
 * descendants (if 'removeDescendants' is true) are not found.
 */
Registry.prototype.remove = function (entry, removeDescendants) {
  var i,
    parentId,
    childIds = [],
    reg = this.registry,
    removed = [];

  entry = getValue(entry);
  if (!this.has(entry)) {
    throw new NotFoundError(entry);
  }

  if (this.hasChild(entry)) {
    parentId = this.registry[entry];
    childIds = findChildren(this.registry, entry);

    if (removeDescendants) {
      removed = removed.concat(remDescendants(this, childIds));
    } else {
      childIds.forEach(function (childId) {
        reg[childId] = parentId;
      });
    }
  }

  delete this.registry[entry];
  removed.push(entry);

  // Remove the deleted items from the records as well.
  for (i = 0; i < removed.length; i++) {
    delete this.records[removed[i]];
  }

  return removed;
};

Registry.prototype.size = function () {
  return Object.keys(this.registry).length;
};

Registry.prototype.toString = function () {
  var value,
    key,
    diff,
    i,
    len = 0,
    output = [];

  // Get the maximum length
  for (key in this.registry) {
    if (len < key.length) {
      len = key.length;
    }
  }
  for (key in this.registry) {
    value = this.registry[key];
    output.push('\t');
    // Add the spaces in front
    diff = len - key.length;
    for (i = 0; i < diff; i++) {
      output.push(' ');
    }
    output.push(key);
    output.push(' - ');
    if (value === '') {
      output.push('*');
    } else {
      output.push(value);
    }
    output.push('\n');
  }

  return output.join('');
};

function remDescendants(reg, entryIds) {
  var removed = [];

  entryIds.forEach(function (entryId) {
    //registry.remove(entryId);
    delete reg.registry[entryId];
    removed.push(entryId);
    while (reg.hasChild(entryId)) {
      removed = removed.concat(
        remDescendants(reg, findChildren(reg.registry, entryId))
      );
    }
  });

  return removed;
}

function findChildren(registry, parentId) {
  var key,
    children = [];

  for (key in registry) {
    if (registry[key] === parentId) {
      children.push(key);
    }
  }

  return children;
}

module.exports = Registry;
