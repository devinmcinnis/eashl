var obj = {
  id: 'eashl',
  postgres: {}
};

module.exports = function(env) {
  if (env == 'development') {
    obj.postgres.url = "postgres://eashl:eashl@localhost/eashl";
  } else if (env == 'staging' || env == 'production') {
    obj.postgres.url = HEROKU_POSTGRESQL_TEAL_URL;
  }
  return obj;
}