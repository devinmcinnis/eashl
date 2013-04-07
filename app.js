var express  = require('express')
  , routes   = require('./routes')
  , http     = require('http')
  , path     = require('path')
  , request  = require('request')
  , routes   = require('./routes')
  , fs       = require('fs')
  , cronJob  = require('cron').CronJob
  , orm      = require('orm')
  , pg       = require('pg')
  , cheerio  = require('cheerio')
  , app      = express()
  , api_env  = app.get('env')
  , configs  = require('./config')(api_env)
  , currentRecord = [];

app.use(orm.express(configs.postgres.url, {
    define: function (db, models) {
      var cb = function(err, item) {
        if (err) { console.log(err); }
        if (item) { console.log(item); }
      }

      db.load('models/models', function (err, item) {
        cb(err, item);

        var Oldstats  = db.models.oldstats;
        var Record    = db.models.records;

        // If "oldstats" table has nothing inside of it, get the current total stats for every player
        Oldstats.find({}, function (err, count) {
          cb(err, item);
          if (count.length < 1) {
            routes.fillStats();
          }
        });

        Record.find({team_id: 224}, function (err, exists) {
          if (exists.length < 1) {

            Record.create([{
              team_id: 224,
              name: 'Puck Goes First',
              wins: 20,
              losses: 9,
              otl: 0
            }], function (err, team) {
              currentRecord.push(team[0].wins);
              currentRecord.push(team[0].losses);
              currentRecord.push(team[0].otl);
              db.close();
            });

          } else {

            Record.find({team_id: 224}, function (err, team) {
              currentRecord.push(team[0].wins);
              currentRecord.push(team[0].losses);
              currentRecord.push(team[0].otl);
              db.close();
            });

          }
        });

      });
    }
}));

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon(__dirname + '/public/favicon.ico'));
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

// var bloop = new Date();
// bloop.setSeconds(bloop.getSeconds() + 2);

new cronJob(configs.timer, function(){
// new cronJob(bloop, function(){

  request({uri: 'http://eashl.herokuapp.com'}, function () {});

  if ( typeof currentRecord != 'undefined' ) {
    console.log('Team\'s current record is: ' + currentRecord.join('-'));
    console.log('Checking to see if team has played a game..'); }

  var teamRecord = 'http://www.easportsworld.com/en_US/clubs/401A0001/224/overview';

  request({uri: teamRecord}, function (err, response, body) {
    if ( err && response.statusCode != 200 ) {console.log('Request error.');}

      var $ = cheerio.load(body);
      var $body = $('.current-season-club-stats-main-container'),
      record = $body.find('tr.strong > td:nth-child(2) span.black').text().split(' - ');
      var newGame = false;

      // For each part of record (wins-losses-ties), check against teams current record and get the game stats from the most recently played game if it's different
      for (var i = 0, rLen = record.length; i < rLen; i += 1) {
        if ( record[i] != currentRecord[i] && currentRecord.length > 2 ) {
          console.log('Team\'s new record is: ' + record.join('-'));
          newGame = true;
          currentRecord = record;
          return routes.getLatestGame(record);
        }
      }

      if (!newGame) {
        console.log('The team has not played a new game');
      }

      return currentRecord = record;

  });
}, null, true);

app.get('/', routes.index);

app.get('/player/:id', routes.player);

app.get('/filloldstatsbecauseifuckedsomethingup', routes.fillStats);

app.get('/whoisonline', routes.whoIsOnline);

app.use(function(req, res, next){
  res.status(404);

  // respond with html page
  if (req.accepts('html')) {
    res.render('404', { url: req.url });
    return;
  }

  // respond with json
  if (req.accepts('json')) {
    res.send({ error: 'Not found' });
    return;
  }

  // default to plain-text. send()
  res.type('txt').send('Not found');
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
