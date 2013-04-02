var express  = require('express')
  , routes   = require('./routes')
  , http     = require('http')
  , path     = require('path')
  , request  = require('request')
  , jsdom    = require('jsdom')
  , routes   = require('./routes')
  , cronJob  = require('cron').CronJob
  , orm      = require('orm')
  , pg       = require('pg')
  , app      = express()
  , api_env  = app.get('env')
  , configs  = require('./config')(api_env);

app.use(orm.express(configs.postgres.url, {
    define: function (db, models) {
      var cb = function(err, item) {
        if (err) { console.log(err); }
        if (item) { console.log(item); }
      }

      db.load('models/models', function (err, item) {
        cb(err, item);

        var Oldstats = db.models.oldstats;
        Oldstats.count({}, function (err, count) {
          cb(err, item);
          if (count < 1) {
            routes.fillStats();
          }
        });

      });
    }
}));

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(require('stylus').middleware(__dirname + '/public'));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

var currentRecord = ['0', '0', '1'];
var bloop = new Date();
bloop.setSeconds(bloop.getSeconds() + 2);

new cronJob('0 */20 * * * *', function(){
// new cronJob(bloop, function(){

  if ( typeof currentRecord != 'undefined' ) {
    console.log('Team\'s current record is: ' + currentRecord.join('-'));
    console.log('Checking to see if team has played a game..'); }

  var teamRecord = 'http://www.easportsworld.com/en_US/clubs/401A0001/224/overview';

  request({uri: teamRecord}, function (err, response, body) {
    // Basic error check
    if ( err && response.statusCode != 200 ) {console.log('Request error.')}
    // Send the body parameter as the HTML code we will parse in jsdom
    // Also, tell jsdom to attach jQuery in the scripts
    jsdom.env({
      html: body,
      scripts: ['http://code.jquery.com/jquery-1.6.min.js']
    },
    function (err, window) {
      var $ = window.jQuery,
      $body = $('body .current-season-club-stats-main-container'),
      record = $body.find('tr.strong > td:nth-child(2) span.black').text().split(' - ');

      // For each part of record (wins-losses-ties), check against teams current record and get the game stats from the most recently played game if it's different
      record.map(function (callback, key) {

        if (typeof currentRecord === 'undefined') {
          console.log('Created team record of: ' + record.join('-'));
        } else if ( record[key] != currentRecord[key] && currentRecord.length > 2 ) {
          console.log('Team\'s new record is: ' + record.join('-'));
          routes.getLatestGame();
        } else {
          return;
        }

      });

      return currentRecord = record;

    });
  });
}, null, true);

app.get('/', routes.index);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
