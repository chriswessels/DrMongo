let getConnection = (data, cb) => {
  const connection = data.connection;
  const uri = MongodbUriParser.parse(data.connection.mongoUri);
  uri.database = data.database ? data.database : null;
  const mongoUri = MongodbUriParser.format(uri);
  log('> connecting to: ' + mongoUri);
  MongoInternals.NpmModules.mongodb.module(mongoUri, (error, db) => {
    if(error) {
      log('> connection error: ', error);
      cb(error, null);
    } else {
      log('> connected');
      cb(null, db);
    }
    log('-----');
  });
};


MongoHelpers = {

  getDatabases(connection) {
    let getConnectionWrapper = Meteor.wrapAsync(getConnection);
    let db = getConnectionWrapper({connection: connection});
    // Use the admin database for the operation
    var adminDb = db.admin();

    // Get all the available databases
    let listDatabasesWrapper = Meteor.wrapAsync(adminDb.listDatabases);
    let databases = listDatabasesWrapper();

    db.close();

    let databaseNames = [];
    _.each(databases.databases, (value) => {
      if (value.name == 'local' || value.name == 'admin') return false;
      databaseNames.push(value.name)
    });

    return databaseNames;
  },

  getCollections(connection, database) {
    let getConnectionWrapper = Meteor.wrapAsync(getConnection);
    let db = getConnectionWrapper({connection: connection, database: database});
    if (db === false) return false;

    let collectionNamesWrapper = Meteor.wrapAsync((cb) => {
      db.collectionNames((error, response) => {
        cb(error, response);
      })
    });
    let collections = collectionNamesWrapper();

    db.close();
    let collectionNames = [];
    _.each(collections, (value) => {
      if (value.name == 'system.indexes') return false;
      collectionNames.push(value.name)
    });
    return collectionNames;
  },

  createCollection(database, collectionName) {
    let getConnectionWrapper = Meteor.wrapAsync(getConnection);
    let db = getConnectionWrapper({connection: database.connection(), database: database.name});
    if (db === false) return false;

    let createCollectionWrapper = Meteor.wrapAsync((cb) => {
      db.createCollection(collectionName, (error, response) => {
        cb(null, true);
      });
    });

    let response = createCollectionWrapper();

    return response;
  }

};
