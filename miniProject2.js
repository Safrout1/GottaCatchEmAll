var fs = require("fs");
var cp = require('child_process');
var s = '', query = '';

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
	var m = '['
	var p = '';
	var w = '';
	s += 'rows(' + N + ').\n';
	s += 'columns(' + M + ').\n';
	s += 'timeToHatch(' + hatch + ').\n';
	for (var i = 0; i < N; i++)
		for (var j = 0; j < M; j++)
			if (grid[i][j] == 'p') {
				p += 'pokemon(' + i + ', ' + j + ').\n';
				m += '(' + i + ', ' + j + '),';
			}
			else if (grid[i][j] == '#')
				w += 'wall(' + i + ', ' + j + ').\n';
	if(m.length > 1) m = m.slice(0, -1);
  m += ']';
	s += p;
	s += w;
  query = 'iterativeDeepening(atState(';
	if (grid[si][sj] != 'p'){
		s += 'source(' + si + ', ' + sj + ', [], ' + hatch + ').\n';
  }
  else{
		s += 'source(' + si + ', ' + sj + ', [(' + si + ', ' + sj + ')], ' + hatch + ').\n';
  }
  s += 'destination(' + ei + ', ' + ej + ', ' + m + ', 0).\n';
  query += ei + ', ' + ej + ', ' + m + ', 0';

}
genMaze();
query += ',S),0,R).\n';
var code = loadCode();
s += code + '\n';
console.log(query);
fs.writeFileSync('mini3.pl', s, 'utf8');
var childProcess = cp.spawn('swipl', ['mini3.pl']);

childProcess.stdout.setEncoding('utf8');

var data_line = '';
childProcess.stdin.write(query);
var stdin = process.openStdin();
stdin.addListener("data", function(d) {
    childProcess.stdin.write(';\n');
});
childProcess.stdout.on("data", function(data) {
  data_line += data;
  if (data_line.split('=').length - 1 == 2) {
    console.log(data_line);
    data_line = '';
    var stdin = process.openStdin();
  }
});

function loadCode(){
  var code = fs.readFileSync('mini2.pl', 'utf8');
  return code;
}
