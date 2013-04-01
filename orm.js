// client = new pg.Client(connectionString);
// client.connect();

// // Queries are queued and executed one after another once the connection becomes available
// client.query("CREATE TEMP TABLE team(team_id varchar, name varchar)");
// client.query("CREATE TEMP TABLE game(game_id integer, team1_id varchar, team1_score integer, team2_id varchar, team2_score integer)");
// client.query("CREATE TEMP TABLE player(player_id integer, name varchar)");
// client.query("CREATE TEMP TABLE stats(player_id integer, game_id integer, goals integer, assists integer, points integer, plus_minus integer, pims integer, ppg integer, shg integer, total_hits integer, bs integer, shots integer, shooting_p integer, gaa integer, ga integer, saves integer, save_p integer, so integer)");
// client.query("CREATE TEMP TABLE oldstats(player_id integer, goals integer, assists integer, points integer, plus_minus integer, pims integer, ppg integer, shg integer, total_hits integer, bs integer, shots integer, shooting_p integer, gaa integer, ga integer, saves integer, save_p integer, so integer)");
// client.query("INSERT INTO team(team_id, name) values($1, $2)", ['224', 'Puck Goes First']);
// var query = client.query("SELECT * FROM team WHERE name = $1", ['Puck Goes First']);

// // Can stream row results back 1 at a time
// query.on('row', function(row) {
//   console.log(row);
//   console.log("Team name is " + row.name);
//   console.log("Team ID is " + row.team_id);
// });

// // Fired after last row is emitted
// query.on('end', function() { 
//   client.end();
// });

app.use(orm.express(connectionString, {
    define: function (db, models) {
        
        models.team = db.define("team", {
          team_id     : Number,
          name        : String
        });

        var Player = models.player = db.define("player", {
          player_id   : Number,
          name        : String
        });

        models.game = db.define("game", {
          game_id   : Number,
          team1_id  : Number,
          team2_id  : Number,
          date      : Date
        });

        models.stats = db.define("stats", {
          player_id   : Number,
          game_id     : Number,
          goals       : Number,
          assists     : Number,
          points      : Number,
          plus_minus  : Number,
          pims        : Number,
          ppg         : Number,
          shg         : Number,
          total_hits  : Number,
          bs          : Number,
          shots       : Number,
          shooting_p  : Number,
          gaa         : Number,
          saves       : Number,
          save_p      : Number,
          so          : Number
        });

        models.oldstats = db.define("stats", {
          player_id   : Number,
          goals       : Number,
          assists     : Number,
          points      : Number,
          plus_minus  : Number,
          pims        : Number,
          ppg         : Number,
          shg         : Number,
          total_hits  : Number,
          bs          : Number,
          shots       : Number,
          shooting_p  : Number,
          gaa         : Number,
          saves       : Number,
          save_p      : Number,
          so          : Number
        });


        models.player.create([
          {
            player_id : 1,
            name      : "Devin"
          },
          {
            player_id : 2,
            name      : "Joe"
          }],
          function (err, item) {
            console.log(item)
          });

        models.player.find({name: "Devin"}, function (err, people) {
          console.log(people);
        });

      console.log(models.player;


    }
}));