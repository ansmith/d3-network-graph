const width = 960;     // svg width
const height = 600;     // svg height
const dr = 4;      // default point radius
const off = 15;    // cluster hull offset
const expand = {}; // expanded clusters
let data;
let net;
let force;

const curve = d3.svg.line()
    .interpolate("cardinal-closed")
    .tension(.85);

const fill = d3.scale.category20();

const body = d3.select("body");

const vis = body.append("svg")
   .attr("width", width)
   .attr("height", height);

data = graphData;
for (let i=0; i<data.links.length; ++i) {
  o = data.links[i];
  o.source = data.nodes[o.source];
  o.target = data.nodes[o.target];
}

const hullg = vis.append("g");
const linkg = vis.append("g");
const nodeg = vis.append("g");

init();

vis.attr("opacity", 1e-6)
  .transition()
    .duration(1000)
    .attr("opacity", 1);

function init() {
  if (force) {
    force.stop();
  }

  net = network(data, net, getGroup, expand);

  force = d3.layout.force()
      .nodes(net.nodes)
      .links(net.links)
      .size([width, height])
      .linkDistance(function(l, i) {
      var n1 = l.source, n2 = l.target;
    // larger distance for bigger groups:
    // both between single nodes and _other_ groups (where size of own node group still counts),
    // and between two group nodes.
    //
    // reduce distance for groups with very few outer links,
    // again both in expanded and grouped form, i.e. between individual nodes of a group and
    // nodes of another group or other group node or between two group nodes.
    //
    // The latter was done to keep the single-link groups ('blue', rose, ...) close.
    return 30 +
      Math.min(20 * Math.min((n1.size || (n1.group != n2.group ? n1.group_data.size : 0)),
                             (n2.size || (n1.group != n2.group ? n2.group_data.size : 0))),
           -30 +
           30 * Math.min((n1.link_count || (n1.group != n2.group ? n1.group_data.link_count : 0)),
                         (n2.link_count || (n1.group != n2.group ? n2.group_data.link_count : 0))),
           100);
      //return 150;
    })
    .linkStrength(function(l, i) {
    return 1;
    })
    .gravity(0.05)   // gravity+charge tweaked to ensure good 'grouped' view (e.g. green group not smack between blue&orange, ...
    .charge(-600)    // ... charge is important to turn single-linked groups to the outside
    .friction(0.5)   // friction adjusted to get dampened display: less bouncy bouncy ball [Swedish Chef, anyone?]
      .start();

  hullg.selectAll("path.hull").remove();
  const hull = hullg.selectAll("path.hull")
      .data(convexHulls(net.nodes, getGroup, off))
    .enter().append("path")
      .attr("class", "hull")
      .attr("d", drawCluster)
      .style("fill", function(d) { return fill(d.group); })
      .on("click", function(d) {
console.log("hull click", d, arguments, this, expand[d.group]);
      expand[d.group] = false; init();
    });

  const link = linkg.selectAll("line.link").data(net.links, linkid);
  link.exit().remove();
  link.enter().append("line")
      .attr("class", "link")
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; })
      .style("stroke-width", function(d) { return d.size || 1; });

  const node = nodeg.selectAll("circle.node").data(net.nodes, nodeid);
  node.exit().remove();
  node.enter().append("circle")
      // if (d.size) -- d.size > 0 when d is a group node.
      .attr("class", function(d) { return "node" + (d.size?"":" leaf"); })
      .attr("r", function(d) { return d.size ? d.size + dr : dr+1; })
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .style("fill", function(d) { return fill(d.group); })
      .on("click", function(d) {
console.log("node click", d, arguments, this, expand[d.group]);
        expand[d.group] = !expand[d.group];
    init();
      });

  node.call(force.drag);

  force.on("tick", function() {
    if (!hull.empty()) {
      hull.data(convexHulls(net.nodes, getGroup, off))
          .attr("d", drawCluster);
    }

    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
  });
}