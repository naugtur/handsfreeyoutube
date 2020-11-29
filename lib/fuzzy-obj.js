const JMeta = require("jmeta");
const Fuse = require("fuse.js");
const _ = require("lodash");

function fuzzyNode(parentObj, path) {
  let jmeta, paths, leaves;
  const data = path ? _.get(parentObj, path) : parentObj;

  function prep() {
    if (!jmeta) {
      jmeta = new JMeta(data);
      paths = jmeta.paths();
      leaves = paths.filter((p) => {
        const field = _.get(data, p);
        return !field || typeof field !== "object";
      });
    }
  }
  function searchLeafPathsFuzzy(query) {
    prep();
    const options = {
      includeScore: true,
      ignoreFieldNorm: true,
    };

    const fuse = new Fuse(leaves, options);

    const result = _.sortBy(fuse.search(query), "score");

    return result.map((r) => r.item).map((l) => fuzzyNode(data, l));
  }
  function searchLeafPathsRegex(regex) {
    prep();
    const options = {
      includeScore: true,
    };

    return leaves.filter((l) => regex.test(l)).map((l) => fuzzyNode(data, l));
  }
  function findAllExact(list) {
    prep();
    return list.every((k) => leaves.find((l) => l.includes(k)));
  }
  function findAllFuzzy(list) {
    prep();
    return list.every((k) => searchLeafPathsFuzzy(k));
  }
  function flattenInto(list) {
    return list.reduce((result, key) => {
      const bestMatch = searchLeafPathsFuzzy(key)[0];
      result[key] = _.get(data, bestMatch.path);
      return result;
    }, {});
  }

  return {
    path,
    data,
    getLeaves() {
      if (typeof data === "object") {
        prep();
        return leaves.map((l) => fuzzyNode(data, l));
      } else {
        return null;
      }
    },
    parent() {
      const pathChunks = path.split(".");
      pathChunks.pop();
      return fuzzyNode(parentObj, pathChunks.join("."));
    },
    searchLeafPathsFuzzy,
    searchLeafPathsRegex,
    findAllExact,
    findAllFuzzy,
    flattenInto,
  };
}

function goUpUntilFieldsFound(item, list) {
  let found = false;
  while (!found) {
    item = item.parent();
    found = item.findAllExact(list);
  }
  return item;
}

module.exports = {
  fuzzyNode,
  goUpUntilFieldsFound,
};
