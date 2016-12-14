'use strict'

const pg = require('pg')
const Pool = pg.Pool

const path = require('path')

const envFile = require('node-env-file')
envFile(path.join(__dirname, '../../config/postgres.env'))


const databases = require('../constants/databases')
const databaseNames = Object.keys(databases).map(db => databases[db])


databaseNames.push('postgres')


const configs = databaseNames.reduce((acc, database) => {
  acc[database] = {
    host     : process.env.POSTGRES_NETLOC,
    port     : process.env.POSTGRES_PORT || undefined,
    user     : process.env.POSTGRES_USER,
    password : process.env.POSTGRES_PASSWORD || undefined,
    database,
  }

  return acc
}, {})


//process.on('unhandledRejection', (err) => {
  //console.log(err.message, err.stack)
//})


const pools = databaseNames.reduce((acc, database) => {
  acc[database] = new Pool(configs[database])
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

  pg.end()
}


module.exports = {
  runQuery,
  databaseQueryRunners,
  end,
}
