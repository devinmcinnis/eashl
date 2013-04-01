var express  = require('express')
  , app      = express()
  , routes   = require('./routes')
  , http     = require('http')
  , path     = require('path')
  , request  = require('request')
  , jsdom    = require('jsdom')
  , routes   = require('./routes')
  , FastLegSBase = require('FastLegS')
  , pg       = require('pg')
  , connectionString  = process.env.DATABASE_URL || 'postgres://eashl:eashl@localhost/eashl'
  , client
  , query;

client = new pg.Client(connectionString);
client.connect();

// Queries are queued and executed one after another once the connection becomes available
client.query("CREATE TABLE team(team_id varchar, name varchar)");
client.query("CREATE TABLE game(game_id integer, team1_id varchar, team1_score integer, team2_id varchar, team2_score integer)");
client.query("CREATE TABLE player(player_id integer, name varchar)");
client.query("CREATE TABLE stats(player_id integer, game_id integer, goals integer, assists integer, points integer, plus_minus integer, pims integer, ppg integer, shg integer, total_hits integer, bs integer, shots integer, shooting_p integer, gaa integer, ga integer, saves integer, save_p integer, so integer)");
client.query("CREATE TABLE oldstats(player_id integer, goals integer, assists integer, points integer, plus_minus integer, pims integer, ppg integer, shg integer, total_hits integer, bs integer, shots integer, shooting_p integer, gaa integer, ga integer, saves integer, save_p integer, so integer)")

var FastLegS = new FastLegSBase('pg');

var connectionParams = {
  user: 'eashl', password: 'eashl',
  database: 'eashl', host: 'localhost', port: 5432
}

FastLegS.connect(connectionParams);

var callback = function(err, results) {
  console.dir(err);
  console.dir(results);
}

var Team = FastLegS.Base.extend({
  tableName: 'teams',
  primaryKey: 'id'
});

Team.create({
  team_id: 220,
  name: 'Puck Goes First'
}, callback)

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

var currentRecord = ['78', '50', '14'];
var bloop = new Date();
// bloop.setSeconds(bloop.getSeconds() + 5);

var cronJob = require('cron').CronJob;
new cronJob(bloop, function(){

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
