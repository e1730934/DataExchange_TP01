const knexModule = require('knex');

const dbConnection = knexModule({
  client: 'sqlite3',
  connection: {
    filename: './modules/school.db',
  },

  useNullAsDefault: false,
});

module.exports = dbConnection;
