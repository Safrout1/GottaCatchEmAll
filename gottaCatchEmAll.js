var PriorityQueue = require('js-priority-queue');
var hash = require('object-hash');
var expandedCount = 0;

function Position(i, j, orientation) {
	this.i = i;
	this.j = j;
	this.orientation = orientation;
};

function Maze(N, M, grid, source, destination, hatch) {
	this.grid = grid;
	this.N = N;
	this.M = M;
	this.source = source;
	this.destination = destination;
	this.hatch = hatch;
};

function State(position, pokemons, remainingToHatch) {
	this.position = position
	this.pokemons = pokemons;
	this.remainingToHatch = remainingToHatch;
};

function SearchTreeNode(state, parentNode, operator, depth, pathCost, priority) {
	this.state = state;
	this.parentNode = parentNode;
	this.operator = operator;
	this.depth = depth;
	this.pathCost = pathCost;
	this.priority = priority;
};

function SearchProblem(operators, initialState, nextSate, goalTest, pathCostFunction) {
	this.operators = operators;
	this.initialState = initialState;
	this.nextSate = nextSate;
	this.goalTest = goalTest;
	this.pathCostFunction = pathCostFunction;
};

function Result(sequence, cost, nodesExpanded) {
	this.sequence = sequence;
	this.cost = cost;
	this.nodesExpanded = nodesExpanded;
};

function genMaze() {
	var N = parseInt(Math.random() * 5);
	var M = parseInt(Math.random() * 5);
	var grid = [];
	for (var i = 0; i < N; i++) {
		grid.push([]);
		for (var j = 0; j < M; j++) {
			var x = parseInt(Math.random() * 3);
			grid[i].push(x == 2 ? 'p' : x == 1 ? '.' : '#');
		}
	}
	var si = -1;
	var sj = -1;
	var i = 0;
	while (i < N * M) {
		si = parseInt(Math.random() * N);
		sj = parseInt(Math.random() * M);
		if (grid[si][sj] != '#')
			break;
		i++
	}
	if (i == N * M) {
		return genMaze();
	}
	var ei = -1;
	var ej = -1;
	var i =0;
	while (i < N * M) {
		ei = parseInt(Math.random() * N);
		ej = parseInt(Math.random() * M);
		if (grid[ei][ej] != '#')
			break;
		i++;
	}
	if (i == N * M) {
		return genMaze();
	}
	var hatch = parseInt(Math.random() * (N * M + 1));
	var orientations = ['U', 'D', 'L', 'R'];
	var orientation = orientations[parseInt(Math.random() * 4)];
	return new Maze(N, M, grid, new Position(si, sj, orientation), new Position(ei, ej, 'A'), hatch);
}

var vis = {};

function visited(state) {
	var stateHash = hash(state);
	if (Object.prototype.hasOwnProperty.call(vis, stateHash))
		return true;
	return false;
}

function visit(state) {
	vis[hash(state)] = true;
}

function expand(node, problem) {
	var operators = problem.operators;
	var expanded = [];
	for (var i = 0; i < operators.length; i++) {
		var operator = operators[i];
		var newState = problem.nextSate(node.state, operator);
		var newDepth = node.depth + 1
		if (newState != null && visited(newState) == false) {
			expanded.push(new SearchTreeNode(newState, node, operator, newDepth, problem.pathCostFunction(node.state, newState, operator, node.pathCost), 0));
		}
	}
	return expanded;
}

function generalSearch(problem, queuingFunction) {
	vis = {};
	var initialNode = new SearchTreeNode(problem.initialState, null, null, 0, 0, 0);
	var nodes = new PriorityQueue({
		comparator: function(a, b) {
			return (a.priority < b.priority) ? -1 : (a.priority > b.priority) ? 1 : 0 ;
		}
	});
	nodes.queue(initialNode);
	while (true) {
		if (nodes.length == 0)
			return null;
		var node = nodes.dequeue();
		if (problem.goalTest(node.state)) {
			return node;
		}
		nodes = queuingFunction(nodes, expand(node, problem));
	}
}

var setOfPokemons = {};
var DLDepth = 0;

var gottaCatchEmAllNextState = function(state, operator) {
	var orientations = ['L', 'D', 'R', 'U'];
	var orientation = state.position.orientation;
	var orientationIdx = orientations.indexOf(orientation);
	var dx = [0, 1, 0, -1];
	var dy = [-1, 0, 1, 0];
	var direction = (operator == 'L') ? 1 : ((operator == 'R') ? -1 : 0);
	if (direction != 0) {
		var newOrientation = orientations[((orientationIdx + direction) % 4 + 4) % 4];
		var newPosition = new Position(state.position.i, state.position.j, newOrientation);
		return new State(newPosition, JSON.parse(JSON.stringify(state.pokemons)), state.remainingToHatch);
	} else {
		var newI = state.position.i + dx[orientationIdx];
		var newJ = state.position.j + dy[orientationIdx];
		if (newI < 0 || newI >= maze.N || newJ < 0 || newJ >= maze.M || maze.grid[newI][newJ] == '#')
			return null;
		var newPosition = new Position(newI, newJ, orientation);
		if (maze.grid[newI][newJ] == '.') {
			return new State(newPosition, JSON.parse(JSON.stringify(state.pokemons)), Math.max(0, state.remainingToHatch - 1));
		} else {
			var pokemon = hash(new Position(newI, newJ, 'A'));
			if (Object.prototype.hasOwnProperty.call(state.pokemons, pokemon) == true) {
				return new State(newPosition, JSON.parse(JSON.stringify(state.pokemons)), Math.max(0, state.remainingToHatch - 1));
			} else {
				var newSetOfPokemons = JSON.parse(JSON.stringify(state.pokemons));
				newSetOfPokemons[pokemon] = true;
				return new State(newPosition, newSetOfPokemons, Math.max(0, state.remainingToHatch - 1));
			}
		}
	}
	return null;
}

var gottaCatchEmAllGoalStateFunction = function(state) {
	var goal = maze.destination;
	var grid = maze.grid;
	var pokemons = state.pokemons;
	if (state.position.i == goal.i && state.position.j == goal.j && state.remainingToHatch == 0) {
		for (var i = 0; i < maze.N; i++)
			for (var j = 0; j < maze.M; j++)
				if (grid[i][j] == 'p') {
					var position = new Position(i, j, 'A');
					if (Object.prototype.hasOwnProperty.call(pokemons, hash(position)) == false)
						return false;
				}
		return true;
	}
	return false;
}

var gottaCatchEmAllPathCostFunction = function(parentState, newState, operator, parentPathCost) {
	if (operator == 'F')
		return parentPathCost + 1;
	else
		return parentPathCost;
}

var getGottaCatchEmAllInitialState = function() {
	var newSetOfPokemons = JSON.parse(JSON.stringify(setOfPokemons));
	if (maze.grid[maze.source.i][maze.source.j] == 'p') {
		var pokemon = hash(new Position(maze.source.i, maze.source.j, 'A'));
		newSetOfPokemons[pokemon] = true;
	}
	return new State(maze.source, newSetOfPokemons, maze.hatch);
}

var gottaCatchEmAllOperators = ['L', 'R', 'F'];



var priority = 0;

function DFSQueuingFunction(nodes, expandedNodes) {
	for (var i = 0; i < expandedNodes.length; i++) {
		var currentNode = expandedNodes[i];
		currentNode.priority = priority--;
		visit(currentNode.state);
		expandedCount++;
		nodes.queue(currentNode);
	}
	return nodes;
}

function depthFirstSearch(problem) {
	priority = -1;
	return generalSearch(problem, DFSQueuingFunction);
}

function BFSQueuingFunction(nodes, expandedNodes) {
	for (var i = 0; i < expandedNodes.length; i++) {
		var currentNode = expandedNodes[i];
		currentNode.priority = priority++;
		visit(currentNode.state);
		expandedCount++;
		nodes.queue(currentNode);
	}
	return nodes;
}

function breadthFirstSearch(problem) {
	priority = 1;
	return generalSearch(problem, BFSQueuingFunction);
}

function DLQueuingFunction(nodes, expandedNodes) {
	for (var i = 0; i < expandedNodes.length; i++) {
		var currentNode = expandedNodes[i];
		if (currentNode.depth <= DLDepth) {
			currentNode.priority = priority--;
			expandedCount++;
			nodes.queue(currentNode);
		}
	}
	return nodes;
}

function DepthLimitedSearch(problem, depth) {
	priority = -1;
	return generalSearch(problem, DLQueuingFunction);
}

function IterativeDeepining(problem) {
	DLDepth = 0;
	while (true) {
		var node = DepthLimitedSearch(problem, DLDepth);
		if (node != null)
			return node;
		DLDepth++;
	}
	return null;
}

function UCQueuingFunction(nodes, expandedNodes) {
	for (var i = 0; i < expandedNodes.length; i++) {
		var currentNode = expandedNodes[i];
		currentNode.priority = currentNode.pathCost;
		visit(currentNode.state);
		expandedCount++;
		nodes.queue(currentNode);
	}
	return nodes;
}

function UniformCostSearch(problem) {
	return generalSearch(problem, UCQueuingFunction);
}

function heuristic1(state) {
	return state.remainingToHatch;
}

function GR1QueuingFunction(nodes, expandedNodes) {
	for (var i = 0; i < expandedNodes.length; i++) {
		var currentNode = expandedNodes[i];
		currentNode.priority = heuristic1(currentNode.state);
		visit(currentNode.state);
		expandedCount++;
		nodes.queue(currentNode);
	}
	return nodes;
}

function GreedySearch1(problem) {
	return generalSearch(problem, GR1QueuingFunction);
}

function heuristic2(state) {
	var pokemonsCount = 0;
	for (var i = 0; i < maze.N; i++)
		for (var j = 0; j < maze.M; j++)
			if (maze.grid[i][j] == 'p')
				pokemonsCount++;
	return pokemonsCount - Object.keys(state.pokemons).length;
}

function GR2QueuingFunction(nodes, expandedNodes) {
	for (var i = 0; i < expandedNodes.length; i++) {
		var currentNode = expandedNodes[i];
		currentNode.priority = heuristic2(currentNode.state);
		visit(currentNode.state);
		expandedCount++;
		nodes.queue(currentNode);
	}
	return nodes;
}

function GreedySearch2(problem) {
	return generalSearch(problem, GR2QueuingFunction);
}

function heuristic3(state) {
	return Math.abs(state.position.i - maze.destination.i) + Math.abs(state.position.j - maze.destination.j);
}

function GR3QueuingFunction(nodes, expandedNodes) {
	for (var i = 0; i < expandedNodes.length; i++) {
		var currentNode = expandedNodes[i];
		currentNode.priority = heuristic3(currentNode.state);
		visit(currentNode.state);
		expandedCount++;
		nodes.queue(currentNode);
	}
	return nodes;
}

function GreedySearch3(problem) {
	return generalSearch(problem, GR3QueuingFunction);
}

function AS1QueuingFunction(nodes, expandedNodes) {
	for (var i = 0; i < expandedNodes.length; i++) {
		var currentNode = expandedNodes[i];
		currentNode.priority = heuristic1(currentNode.state) + currentNode.pathCost;
		visit(currentNode.state);
		expandedCount++;
		nodes.queue(currentNode);
	}
	return nodes;
}

function AStar1(problem) {
	return generalSearch(problem, AS1QueuingFunction);
}

function AS2QueuingFunction(nodes, expandedNodes) {
	for (var i = 0; i < expandedNodes.length; i++) {
		var currentNode = expandedNodes[i];
		currentNode.priority = heuristic2(currentNode.state) + currentNode.pathCost;
		visit(currentNode.state);
		expandedCount++;
		nodes.queue(currentNode);
	}
	return nodes;
}

function AStar2(problem) {
	return generalSearch(problem, AS2QueuingFunction);
}

function AS3QueuingFunction(nodes, expandedNodes) {
	for (var i = 0; i < expandedNodes.length; i++) {
		var currentNode = expandedNodes[i];
		currentNode.priority = heuristic3(currentNode.state) + currentNode.pathCost;
		visit(currentNode.state);
		expandedCount++;
		nodes.queue(currentNode);
	}
	return nodes;
}

function AStar3(problem) {
	return generalSearch(problem, AS3QueuingFunction);
}

function search(localmaze, strategy, visualise) {
	maze = localmaze;
	var gottaCatchEmAll = new SearchProblem(gottaCatchEmAllOperators,
										getGottaCatchEmAllInitialState(),
										gottaCatchEmAllNextState,
										gottaCatchEmAllGoalStateFunction,
										gottaCatchEmAllPathCostFunction);
	console.log("Maze Dimensions: " + maze.N + " X " + maze.M);
	console.log("The Initial Grid: ");
	console.log(maze.grid);
	console.log("The Initial Position: " + maze.source.i + " " + maze.source.j + " " + maze.source.orientation);
	console.log("The Destination Position: " + maze.destination.i + " " + maze.destination.j + " " + maze.destination.orientation);
	console.log("The Time To Hatch The Egg: " + maze.hatch);
	var res = null;
	expandedCount = 0;
	if (strategy == "BF") {
		res = breadthFirstSearch(gottaCatchEmAll);
	} else if (strategy == "DF") {
		res = depthFirstSearch(gottaCatchEmAll);
	} else if (strategy == "ID") {
		res = IterativeDeepining(gottaCatchEmAll);
	} else if (strategy == "UC") {
		res = UniformCostSearch(gottaCatchEmAll);
	} else if (strategy == "GR1") {
		res = GreedySearch1(gottaCatchEmAll);
	} else if (strategy == "GR2") {
		res = GreedySearch2(gottaCatchEmAll);
	} else if (strategy == "GR3") {
		res = GreedySearch3(gottaCatchEmAll);
	} else if (strategy == "AS1") {
		res = AStar1(gottaCatchEmAll);
	} else if (strategy == "AS2") {
		res = AStar2(gottaCatchEmAll);
	} else if (strategy == "AS3") {
		res = AStar3(gottaCatchEmAll);
	}
	if (res == null) {
		if (visualise == true)
			console.log("No Solution Found");
		return null;
	} else {
		var tempSequence = [];
		var tempRes = JSON.parse(JSON.stringify(res));
		while (true) {
			if (tempRes == null)
				break;
			tempSequence.push(tempRes);
			tempRes = tempRes.parentNode;
		}
		var sequence = [];
		for (var i = tempSequence.length - 1; i >= 0; i--)
			sequence.push(tempSequence[i]);
		var printed = [];
		printed.push("Start");
		for (var i = 0; i < sequence.length; i++) {
			printed.push("I am at: (" + sequence[i].state.position.i + ", " + sequence[i].state.position.j + ", " + sequence[i].state.position.orientation + ")");
			for (var j = 0; j < maze.N; j++) {
				var line = "";
				for (var k = 0; k < maze.M; k++) {
					if (sequence[i].state.position.i == j && sequence[i].state.position.j == k)
						line += 'A';
					else if (maze.grid[j][k] == '#' || maze.grid[j][k] == '.')
						line += maze.grid[j][k];
					else {
						var pos = new Position(j, k, 'A');
						if (Object.prototype.hasOwnProperty.call(sequence[i].state.pokemons, hash(pos)))
							line += '.';
						else
							line += 'p';
					}
				}
				printed.push(line);
			}
			if (i != sequence.length - 1)
				printed.push("GO " + sequence[i + 1].operator);
			else
				printed.push("you reached the goal");
		}
		if (visualise == true) {
			console.log("Solution Found");
			console.log("Depth: " + res.depth + ", Path Cost: " + res.pathCost);
			console.log("Expanded Nodes: " + expandedCount);
			for (var i = 0; i < printed.length; i++)
			console.log(printed[i]);
		}
		return new Result(printed, res.pathCost, expandedCount);
	}
}

function main() {
	var strategies = ["BF", "DF", "ID", "UC", "GR1", "GR2", "GR3", "AS1", "AS2", "AS3"];
	maze = genMaze();
	for (var i = 0; i < strategies.length; i++) {
		console.log("The Strategy is: " + strategies[i]);
		search(maze, strategies[i], true);
	}
}

main();