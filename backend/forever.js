var forever = require('forever-monitor');

var child = new (forever.Monitor)('server.js', {
  max: 10,
  silent: false,
  args: []
});

child.on('watch:restart', function(info) {
    console.error('Restarting script because ' + info.file + ' changed');
});

child.on('exit', function () {
  console.log('your-filename.js has exited after 3 restarts');
});

child.start();