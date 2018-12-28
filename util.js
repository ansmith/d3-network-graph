
function noop() { return false; }

function nodeid(n) {
  return n.size ? "_g_"+n.group : n.name;
}

function linkid(l) {
  var u = nodeid(l.source),
      v = nodeid(l.target);
  return u<v ? u+"|"+v : v+"|"+u;
}

function getGroup(n) { return n.group; }

function convexHulls(nodes, index, offset) {
  var hulls = {};

  // create point sets
  for (var k=0; k<nodes.length; ++k) {
    var n = nodes[k];
    if (n.size) continue;
    var i = index(n),
        l = hulls[i] || (hulls[i] = []);
    l.push([n.x-offset, n.y-offset]);
    l.push([n.x-offset, n.y+offset]);
    l.push([n.x+offset, n.y-offset]);
    l.push([n.x+offset, n.y+offset]);
  }

  // create convex hulls
  var hullset = [];
  for (i in hulls) {
    hullset.push({group: i, path: d3.geom.hull(hulls[i])});
  }

  return hullset;
}

function drawCluster(d) {
  return curve(d.path); // 0.8
}