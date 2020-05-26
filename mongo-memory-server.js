// for testing

var { MongoMemoryServer } = require('mongodb-memory-server');

const mongod = new MongoMemoryServer();

async function init() {
    const uri = await mongod.getUri();
    const port = await mongod.getPort();
    const dbPath = await mongod.getDbPath();
    const dbName = await mongod.getDbName();

    //console.log(mongod.getInstanceInfo());

    return {uri, port, dbPath, dbName};
}  

init().then(info => {console.log(info)});

//module.exports = init;