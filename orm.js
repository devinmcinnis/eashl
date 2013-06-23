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