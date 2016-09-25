#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const async = require('async')
const mkdirp = require('mkdirp')

const argv = require('minimist')(process.argv.slice(2))

const assignment = argv.assignment
if (!assignment) {
  console.error('USAGE: generateSolutionsOutput --assignment=ASSIGNMENT_NAME')
  process.exit(1)
}

const dbServers = require('../src/constants/databaseServers')
const dbServerNames = Object.keys(dbServers).map(s => dbServers[s])


const assignmentToDatabaseMap = require('../src/constants/assignmentToDatabaseMap')
const DB_NAME = assignmentToDatabaseMap[assignment].toLowerCase()


const dbUtils = require('../src/utils/DBUtils')
const dbServices = dbUtils.dbServices
const queryRunners = dbUtils.queryRunnersForDatabases[DB_NAME]


const assignmentDir = path.join(__dirname, '../solutions/', assignment)
const scriptsDir = path.join(assignmentDir, 'scripts')
const resultsDir = path.join(assignmentDir, 'results')

mkdirp.sync(resultsDir)


const queryResultSerializer = (db, fileName, cb) => {

  const sqlPath = path.join(scriptsDir, db, fileName)

  fs.readFile(sqlPath, 'utf8', (err, q) => {
    if (err) {
      return cb(err)
    }

    queryRunners[db](q, (err2, results) => {

      if (err2) {
        return cb(err2)
      }

      let resDir = path.join(resultsDir, db)

      mkdirp(resDir, (err3) => {
        if (err3) {
          return cb(err3)
        }

        let resultFileName = fileName.replace(/sql/, 'json')
        let resultsPath = path.join(resDir, resultFileName)
        let resultsJSON = JSON.stringify(results)

        return fs.writeFile(resultsPath, resultsJSON, cb)
      })
    })
  })
}


const _generateResults = (db, cb) => {
  let sqlDir = path.join(scriptsDir, db)

  fs.readdir(sqlDir, (err, files) => {
    if (err) {
      return cb(err)
    }

    const fn = queryResultSerializer.bind(null, db)

    async.each(files, fn, cb)
  })
}



async.each(dbServerNames, _generateResults, (err) => {

  let dbServicesKeys = Object.keys(dbServices)

  for (let i = 0; i < dbServicesKeys.length; ++i) {
    dbServices[dbServicesKeys[i]].end()
  }

  if (err) {
    throw err
  }
})


