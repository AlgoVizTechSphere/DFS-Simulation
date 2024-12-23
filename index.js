(function () {
  document.addEventListener("DOMContentLoaded", function () {
    let $$ = (selector) => Array.from(document.querySelectorAll(selector));
    let $ = (selector) => document.querySelector(selector);

    let tryPromise = (fn) => Promise.resolve().then(fn);

    let toJson = async (obj) => {
      const jsonData = await obj.json(); // Read the response body once
      return jsonData;
    };
    let toText = (obj) => obj.text();

    let cy;
    let $stylesheet = $("#style");
    let getStylesheet = (name) => {
      let convert = (res) =>
        name.match(/[.]json$/) ? toJson(res) : toText(res);

      return fetch(`${name}`).then(convert);
    };
    let applyStylesheet = (stylesheet) => {
      if (typeof stylesheet === typeof "") {
        cy.style().fromString(stylesheet).update();
      } else {
        cy.style().fromJson(stylesheet).update();
      }
    };
    let applyStylesheetFromSelect = () =>
      Promise.resolve($stylesheet.value)
        .then(getStylesheet)
        .then(applyStylesheet);

    let $dataset = $("#data");
    let $inputFields = $("#inputFields");
    let $runAlgorithm = $("#runAlgorithm");
    let $startNode = $("#startNode");
    let $endNode = $("#endNode");
    let $maxDistance = $("#maxDistance");

    let getDataset = (name) => {
      return fetch(`${name}`).then(toJson);
    };
    let applyDataset = async (dataset) => {
      // Loop through the data and add options to the select box for nodes
      dataset.forEach(function (item) {
        if (item.group === "nodes") {
          var nodeId = item.data.id;
          var nodeName = item.data.name;

          $startNode.append(new Option(nodeName, nodeId));
          $endNode.append(new Option(nodeName, nodeId));
        }
      });
      // so new eles are offscreen
      cy.zoom(0.001);
      cy.pan({ x: -9999999, y: -9999999 });
      // replace eles
      cy.elements().remove();
      cy.add(dataset);
    };
    let applyDatasetFromSelect = () =>
      Promise.resolve($dataset.value).then(getDataset).then(applyDataset);

    let calculateCachedCentrality = () => {
      let nodes = cy.nodes();

      if (nodes.length > 0 && nodes[0].data("centrality") == null) {
        let centrality = cy.elements().closenessCentralityNormalized();

        nodes.forEach((n) => n.data("centrality", centrality.closeness(n)));
      }
    };

    let $layout = $("#layout");
    let maxLayoutDuration = 1500;
    let layoutPadding = 50;
    let concentric = function (node) {
      calculateCachedCentrality();

      return node.data("centrality");
    };
    let levelWidth = function (nodes) {
      calculateCachedCentrality();

      let min = nodes.min((n) => n.data("centrality")).value;
      let max = nodes.max((n) => n.data("centrality")).value;

      return (max - min) / 5;
    };
    let layouts = {
      cola: {
        name: "cola",
        padding: layoutPadding,
        nodeSpacing: 12,
        edgeLengthVal: 45,
        animate: true,
        randomize: true,
        maxSimulationTime: maxLayoutDuration,
        boundingBox: {
          // to give cola more space to resolve initial overlaps
          x1: 0,
          y1: 0,
          x2: 1400,
          y2: 1400,
        },
        edgeLength: function (e) {
          let w = e.data("weight");

          if (w == null) {
            w = 0.5;
          }

          return 45 / w;
        },
      },
      concentricCentrality: {
        name: "concentric",
        padding: layoutPadding,
        animate: true,
        animationDuration: maxLayoutDuration,
        concentric: concentric,
        levelWidth: levelWidth,
      },
      concentricHierarchyCentrality: {
        name: "concentric",
        padding: layoutPadding,
        animate: true,
        animationDuration: maxLayoutDuration,
        concentric: concentric,
        levelWidth: levelWidth,
        sweep: (Math.PI * 2) / 3,
        clockwise: true,
        startAngle: (Math.PI * 1) / 6,
      },
    };
    let prevLayout;
    let getLayout = (name) => Promise.resolve(layouts[name]);
    let applyLayout = (layout) => {
      if (prevLayout) {
        prevLayout.stop();
      }

      let l = (prevLayout = cy.makeLayout(layout));

      return l.run().promiseOn("layoutstop");
    };
    let applyLayoutFromSelect = () =>
      Promise.resolve($layout.value).then(getLayout).then(applyLayout);

    let $algorithm = $("#algorithm");

    let getAlgorithm = (name) => {
      if (name !== "none" && name !== "custom") {
        $inputFields.style.display = "block";
      } else {
        $inputFields.style.display = "none";
      }
      switch (name) {
        case "bfs":
          return Promise.resolve(cy.elements().bfs.bind(cy.elements()));
        case "dfs":
          return Promise.resolve(cy.elements().dfs.bind(cy.elements()));
        case "astar":
          return Promise.resolve(cy.elements().aStar.bind(cy.elements()));
        case "maxdistance":
          return Promise.resolve(dfsWithinDistance.bind(cy.elements()));
        case "none":
          return Promise.resolve(undefined);
        case "custom":
          return Promise.resolve(undefined); // replace with algorithm of choice
        default:
          return Promise.resolve(undefined);
      }
    };
    let runAlgorithm = (algorithm) => {
      if (algorithm === undefined) {
        return Promise.resolve(undefined);
      } else {
        let options = {
          weight: (edge) => edge.data("weight") || 1,
          root: `#${$startNode.value}`,
          // astar requires target; goal property is ignored for other algorithms
          goal: `#${$endNode.value}`,
          maxDistance: +$maxDistance.value,
        };
        return Promise.resolve(algorithm(options));
      }
    };
    let currentAlgorithm;
    let animateAlgorithm = (algResults) => {
      // clear old algorithm results
      cy.$().removeClass("highlighted start end");
      currentAlgorithm = algResults;
      if (algResults === undefined || algResults.path === undefined) {
        return Promise.resolve();
      } else {
        let i = 0,
          prev = 0,
          j = 0,
          k = Math.floor(Math.random() * 100);
        // for astar, highlight first and final before showing path
        if (algResults.distance) {
          // Among DFS, BFS, A*, only A* will have the distance property defined
          algResults.path.first().addClass("highlighted start");
          algResults.path.last().addClass("highlighted end");
          // i is not advanced to 1, so start node is effectively highlighted twice.
          // this is intentional; creates a short pause between highlighting ends and highlighting the path
        }
        if (algResults.path === "multiple") {
          algResults.elements[0].addClass("highlighted pink");
          return new Promise((resolve) => {
            let highlightNext = () => {
              if (
                currentAlgorithm === algResults &&
                i < algResults.paths.length
              ) {
                if (j < algResults.paths[i].edges.length) {
                  algResults.paths[i].edges[j].addClass("highlighted");
                  algResults.paths[i].nodes[j + 1].addClass("highlighted");
                  j++;
                } else {
                  i++;
                  k = Math.floor(Math.random() * 100);
                  prev = j;
                  if (i > 0 && i < algResults.paths.length) {
                    for (var l = prev - 1; l >= 0; l--) {
                      algResults.paths[i - 1].nodes[l + 1].removeClass(
                        "highlighted"
                      );
                      algResults.paths[i - 1].edges[l].removeClass(
                        "highlighted"
                      );
                    }
                  }
                  j = 0;
                }
                setTimeout(highlightNext, 300);
              } else {
                // resolve when finished or when a new algorithm has started visualization
                resolve();
              }
            };
            highlightNext();
          });
        }

        return new Promise((resolve) => {
          let highlightNext = () => {
            if (currentAlgorithm === algResults && i < algResults.path.length) {
              algResults.path[i].addClass("highlighted");
              i++;
              setTimeout(highlightNext, 300);
            } else {
              // resolve when finished or when a new algorithm has started visualization
              resolve();
            }
          };
          highlightNext();
        });
      }
    };
    let applyAlgorithmFromSelect = () =>
      Promise.resolve($algorithm.value)
        .then(getAlgorithm)
        .then(runAlgorithm)
        .then(animateAlgorithm);
    // Register the Cola layout
    cytoscape.use(cytoscapeCola);

    cy = window.cy = cytoscape({
      container: $("#cy"),
    });

    tryPromise(applyDatasetFromSelect)
      .then(applyStylesheetFromSelect)
      .then(applyLayoutFromSelect);

    function dfsWithinDistance({ root, maxDistance }) {
      // Ensure the starting node exists
      const startNode = cy.getElementById(root.substring(1));
      if (!startNode || !startNode.isNode()) {
        throw new Error("Invalid starting node ID");
      }

      let visited = new Set();
      let paths = [];
      let elements = new Set();

      function dfs(currentNode, currentPath, currentDistance, currentEdges) {
        // Mark the current node as visited
        visited.add(currentNode.id());

        // Add the current node to the path and elements set
        currentPath.push(currentNode);
        elements.add(currentNode);

        // If we have reached the exact distance, store the path with edges
        if (Math.floor(currentDistance) === maxDistance) {
          // Calculate the sum of the edge weights in the current path
          const totalWeight = currentEdges.reduce((sum, edge) => {
            const edgeWeight = edge.data("weight") || 1; // Default weight to 1 if undefined
            return sum + edgeWeight;
          }, 0);

          // Push both the node and edge to the path (not their ids)
          paths.push({
            nodes: [...currentPath], // Include nodes
            edges: [...currentEdges], // Include edges
            totalWeight: totalWeight, // Add the total weight of the edges in the path
          });
        }

        // If the current distance exceeds maxDistance, return to avoid further traversal
        if (Math.floor(currentDistance) >= maxDistance) {
          return;
        }

        // Iterate over all outgoing edges and their targets
        currentNode.connectedEdges().forEach((edge) => {
          const targetNode = edge.target();

          // Skip already visited nodes and self-loops
          if (
            visited.has(targetNode.id()) ||
            targetNode.id() === currentNode.id()
          ) {
            return;
          }

          // Add the edge's weight to the current distance
          const edgeWeight = edge.data("weight") || 1; // Default weight to 1 if undefined
          const newDistance = currentDistance + edgeWeight;

          // Add the edge to the elements set
          elements.add(edge);

          // Continue DFS on the target node, also passing the edge along with the path
          dfs(targetNode, [...currentPath], newDistance, [
            ...currentEdges,
            edge,
          ]);
        });

        // Backtrack: remove the current node from the path (not visited set)
        currentPath.pop();
        visited.delete(currentNode.id());
      }

      // Start DFS from the starting node
      dfs(startNode, [], 0, []); // Start DFS with an empty edge list

      // Return the elements involved and the list of paths with edges and total weight
      return {
        elements: Array.from(elements), // Convert Set to Array for compatibility
        path: "multiple",
        paths: paths.map((pathObj) => {
          return {
            nodes: pathObj.nodes, // Return node objects
            edges: pathObj.edges, // Return edge objects
            totalWeight: pathObj.totalWeight, // Return total weight of edges in path
          };
        }),
      };
    }

    // Example usage
    // const result = dfsWithinDistance("0", 5); // Start from node '0', max distance 10

    $dataset.addEventListener("change", function () {
      tryPromise(applyDatasetFromSelect)
        .then(applyLayoutFromSelect)
        .then(applyAlgorithmFromSelect);
    });

    $stylesheet.addEventListener("change", applyStylesheetFromSelect);

    $layout.addEventListener("change", applyLayoutFromSelect);

    $algorithm.addEventListener("change", () =>
      Promise.resolve($algorithm.value).then(getAlgorithm)
    );

    $runAlgorithm.addEventListener("click", applyAlgorithmFromSelect);
  });
})();
