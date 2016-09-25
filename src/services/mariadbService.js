'use strict'

const mysql = require('mysql')

const path = require('path')

const envFile = require('node-env-file')
envFile(path.join(__dirname, '../../config/mariadb.env'))


const databases = require('../constants/databases')
const databaseNames = Object.keys(databases).map(db => databases[db])


// Connections for each database on the MariaDB server.
const configs = databaseNames.reduce((acc, database) => {
  acc[database] = {
    host     : process.env.MARIADB_NETLOC,
    port     : process.env.MARIADB_PORT || undefined,
    user     : process.env.MARIADB_USER,
    password : process.env.MARIADB_PASSWORD || undefined,
    database,
  }

  return acc
}, {})



const pools = databaseNames.reduce((acc, database) => {
  acc[database] = mysql.createPool(configs[database])
  return acc
}, {})



 //code based on example found here: https://github.com/brianc/node-postgres/wiki/Example
const runQuery = (db, text, values, cb) => pools[db].query(text, values, cb)

const databaseQueryRunners = databaseNames.reduce((acc, db) => {
  acc[db] = runQuery.bind(null, db)
  return acc
}, {})


// Used in the database initialization scripts.
// Keeps them from hanging at the end.
const end = () => {
  for (let i = 0; i < databaseNames.length; ++i) {
    pools[databaseNames[i]].end()
  }
}


module.exports = {
  runQuery,
  databaseQueryRunners,
  end,
}
