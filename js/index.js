class Graph {
    constructor() {
        this.nodes = [];
        this.edges = [];
        this.adjacencyList = {};
    }

    addNode(x, y, label) {
        const node = { x, y, label, id: this.nodes.length };
        this.nodes.push(node);
        this.adjacencyList[label] = [];
        return node;
    }

    addEdge(from, to, weight) {
        this.edges.push({ from, to, weight });
        // Add to adjacency list for both directions (undirected graph)
        this.adjacencyList[from.label].push({ node: to, weight });
        this.adjacencyList[to.label].push({ node: from, weight });
    }

    dijkstra(start, end) {
        const distances = {};
        const previous = {};
        const unvisited = new Set();

        // Initialize
        for (let node of this.nodes) {
            distances[node.label] = Infinity;
            previous[node.label] = null;
            unvisited.add(node.label);
        }
        distances[start.label] = 0;

        while (unvisited.size) {
            // Find unvisited node with smallest distance
            let current = null;
            for (let node of this.nodes) {
                if (
                    unvisited.has(node.label) &&
                    (current === null ||
                        distances[node.label] < distances[current.label])
                ) {
                    current = node;
                }
            }

            if (current === end) break;
            if (current === null) break;

            unvisited.delete(current.label);

            for (let neighbor of this.adjacencyList[current.label]) {
                if (!unvisited.has(neighbor.node.label)) continue;

                let tentativeDistance =
                    distances[current.label] + neighbor.weight;
                if (tentativeDistance < distances[neighbor.node.label]) {
                    distances[neighbor.node.label] = tentativeDistance;
                    previous[neighbor.node.label] = current;
                }
            }
        }

        // Reconstruct path
        const path = [];
        let current = end;
        while (current) {
            path.unshift(current);
            current = previous[current.label];
        }

        return {
            path: path.map((node) => node.label),
            distance: distances[end.label],
        };
    }
}

class GraphVisualizer {
    constructor() {
        this.graph = new Graph();
        this.container = document.getElementById("graph-container");
        this.modeSelect = document.getElementById("mode-select");
        this.clearBtn = document.getElementById("clear-btn");
        this.resultDiv = document.getElementById("result");

        this.selectedNodes = [];
        this.edgeWeight = 1;

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.container.addEventListener(
            "click",
            this.handleContainerClick.bind(this),
        );
        this.clearBtn.addEventListener("click", this.clearGraph.bind(this));
        this.computePathBtn.addEventListener(
            "click",
            this.computeShortestPath.bind(this),
        );
    }

    handleContainerClick(event) {
        const mode = this.modeSelect.value;
        const rect = this.container.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        switch (mode) {
            case "add-node":
                this.addNode(x, y);
                break;
            case "add-edge":
                this.handleEdgeSelection(x, y);
                break;
            case "select-path":
                this.handlePathSelection(x, y);
                break;
        }
    }

    addNode(x, y) {
        const label = String.fromCharCode(65 + this.graph.nodes.length);
        const node = this.graph.addNode(x, y, label);

        const nodeEl = document.createElement("div");
        nodeEl.classList.add("node");
        nodeEl.style.left = `${x - 20}px`;
        nodeEl.style.top = `${y - 20}px`;
        nodeEl.textContent = label;
        nodeEl.dataset.id = node.id;

        // Make node draggable
        nodeEl.addEventListener("mousedown", this.startDragging.bind(this));

        this.container.appendChild(nodeEl);
    }

    startDragging(event) {
        const nodeEl = event.target;
        const nodeId = parseInt(nodeEl.dataset.id);
        const node = this.graph.nodes[nodeId];

        const startX = event.clientX;
        const startY = event.clientY;
        const initialLeft = parseFloat(nodeEl.style.left);
        const initialTop = parseFloat(nodeEl.style.top);

        const drag = (moveEvent) => {
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;
            nodeEl.style.left = `${initialLeft + dx}px`;
            nodeEl.style.top = `${initialTop + dy}px`;

            // Update node coordinates
            node.x = initialLeft + dx + 20;
            node.y = initialTop + dy + 20;

            // Redraw edges
            this.redrawEdges();
        };

        const stopDrag = () => {
            document.removeEventListener("mousemove", drag);
            document.removeEventListener("mouseup", stopDrag);
        };

        document.addEventListener("mousemove", drag);
        document.addEventListener("mouseup", stopDrag);
    }

    handleEdgeSelection(x, y) {
        const nodes = this.container.querySelectorAll(".node");
        const clickedNode = Array.from(nodes).find((node) => {
            const rect = node.getBoundingClientRect();
            return (
                x >= rect.left - this.container.getBoundingClientRect().left &&
                x <= rect.right - this.container.getBoundingClientRect().left &&
                y >= rect.top - this.container.getBoundingClientRect().top &&
                y <= rect.bottom - this.container.getBoundingClientRect().top
            );
        });

        if (clickedNode) {
            const nodeId = parseInt(clickedNode.dataset.id);
            const node = this.graph.nodes[nodeId];

            if (this.selectedNodes.length === 0) {
                // First node selected
                this.selectedNodes.push(node);
                clickedNode.classList.add("selected");
            } else if (
                this.selectedNodes.length === 1 &&
                this.selectedNodes[0] !== node
            ) {
                // Second node selected
                const weight = parseFloat(
                    prompt("Enter edge weight:", "1") || "1",
                );
                this.graph.addEdge(this.selectedNodes[0], node, weight);

                // Draw edge
                this.drawEdge(this.selectedNodes[0], node, weight);

                // Reset selection
                this.container
                    .querySelectorAll(".node")
                    .forEach((n) => n.classList.remove("selected"));
                this.selectedNodes = [];
            }
        }
    }

    drawEdge(fromNode, toNode, weight) {
        // Create SVG line
        const line = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg",
        );
        line.setAttribute("class", "edge");
        line.style.position = "absolute";
        line.style.left = "0";
        line.style.top = "0";
        line.style.width = "100%";
        line.style.height = "100%";
        line.style.pointerEvents = "none";

        const path = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line",
        );
        path.setAttribute("x1", fromNode.x);
        path.setAttribute("y1", fromNode.y);
        path.setAttribute("x2", toNode.x);
        path.setAttribute("y2", toNode.y);
        path.setAttribute("stroke", "#333");
        path.setAttribute("stroke-width", "2");

        line.appendChild(path);
        this.container.appendChild(line);

        // Add weight label
        const labelEl = document.createElement("div");
        labelEl.classList.add("edge-label");
        labelEl.textContent = weight;

        // Position label at midpoint
        labelEl.style.left = `${(fromNode.x + toNode.x) / 2}px`;
        labelEl.style.top = `${(fromNode.y + toNode.y) / 2}px`;

        this.container.appendChild(labelEl);
    }

    redrawEdges() {
        // Remove existing edges
        this.container
            .querySelectorAll(".edge, .edge-label")
            .forEach((el) => el.remove());

        // Redraw all edges
        for (let edge of this.graph.edges) {
            this.drawEdge(edge.from, edge.to, edge.weight);
        }
    }

    handlePathSelection(x, y) {
        const nodes = this.container.querySelectorAll(".node");
        const clickedNode = Array.from(nodes).find((node) => {
            const rect = node.getBoundingClientRect();
            return (
                x >= rect.left - this.container.getBoundingClientRect().left &&
                x <= rect.right - this.container.getBoundingClientRect().left &&
                y >= rect.top - this.container.getBoundingClientRect().top &&
                y <= rect.bottom - this.container.getBoundingClientRect().top
            );
        });

        if (clickedNode) {
            const nodeId = parseInt(clickedNode.dataset.id);
            const node = this.graph.nodes[nodeId];

            if (this.selectedNodes.length === 0) {
                // First node selected
                this.selectedNodes.push(node);
                clickedNode.classList.add("selected");
            } else if (
                this.selectedNodes.length === 1 &&
                this.selectedNodes[0] !== node
            ) {
                // Second node selected
                this.computeShortestPath(this.selectedNodes[0], node);

                // Reset selection
                this.container
                    .querySelectorAll(".node")
                    .forEach((n) => n.classList.remove("selected"));
                this.selectedNodes = [];
            }
        }
    }

    computeShortestPath(startNode, endNode) {
        if (arguments.length === 0) {
            // Button click scenario
            if (this.selectedNodes.length !== 2) {
                alert("Please select start and end nodes first");
                return;
            }
            startNode = this.selectedNodes[0];
            endNode = this.selectedNodes[1];
        }

        try {
            const shortestPath = this.graph.dijkstra(startNode, endNode);

            // Highlight path
            this.container.querySelectorAll(".node").forEach((nodeEl) => {
                const nodeLabel = nodeEl.textContent;
                if (shortestPath.path.includes(nodeLabel)) {
                    nodeEl.style.backgroundColor = "#28a745";
                } else {
                    nodeEl.style.backgroundColor = "#007bff";
                }
            });

            // Show result
            this.resultDiv.innerHTML = `
                    <h3>Shortest Path:</h3>
                    <p>Route: ${shortestPath.path.join(" → ")}</p>
                    <p>Total Distance: ${shortestPath.distance}</p>
                `;
        } catch (error) {
            this.resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        }
    }

    clearGraph() {
        // Clear all nodes and edges
        this.container.innerHTML = "";
        this.graph = new Graph();
        this.selectedNodes = [];
        this.resultDiv.innerHTML = "";
    }
}

new GraphVisualizer();
