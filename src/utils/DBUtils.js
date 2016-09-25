'use strict'


const dbServers = require('../constants/databaseServers')
const dbServerNames = Object.keys(dbServers).map(svr => dbServers[svr])

const databases = require('../constants/databases')
const databaseNames = Object.keys(databases).map(db => databases[db])

const assignmentToDatabaseMap = require('../constants/assignmentToDatabaseMap')

const dbServices = dbServerNames.reduce((acc, svr) => {
  acc[svr] = require(`../services/${svr}Service`)
  return acc
}, {})

const queryRunnersForDatabases = databaseNames.reduce((acc, db) => {
  acc[db] = dbServerNames.reduce((acc2, svr) => {
    acc2[svr] = dbServices[svr].databaseQueryRunners[db]
    return acc2
  }, {})

  return acc
}, {})


const queryRunnersForAssignments = Object.keys(assignmentToDatabaseMap).reduce((acc, assignment) => {
  let db = assignmentToDatabaseMap[assignment]
  acc[assignment] = queryRunnersForDatabases[db]
  return acc
}, {})


module.exports = {
  dbServices,
  queryRunnersForDatabases,
  queryRunnersForAssignments,
}
