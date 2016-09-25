'use strict'

const fs = require('fs')
const path = require('path')
const _ = require('lodash')
const async = require('async')


const logger = require('../logger')

const databaseServers = require('../../config/databaseServers')
const dbServerNames = Object.keys(databaseServers).map(svr => databaseServers[svr])

const solutionsDir = path.join(__dirname, '../../solutions')
const assignmentNames = fs.readdirSync(solutionsDir).filter(f => !f.match(/^\./))


// queryRunnersForDatabases[
const queryRunnersForAssignments = require('../utils/DBUtils').queryRunnersForAssignments



const expectedScripts = assignmentNames.reduce((acc, assignment) => {

  acc[assignment] = dbServerNames.reduce((acc2, svr) => {
    let dirPath = path.join(solutionsDir, assignment, 'scripts', svr)
    acc2[svr] = fs.readdirSync(dirPath)
    return acc2
  }, {})

  return acc
}, {})


const expectedResults = assignmentNames.reduce((acc, assignment) => {

  acc[assignment] = dbServerNames.reduce((acc2, svr) => {
    let dirPath = path.join(solutionsDir, assignment, 'results', svr)
    let resultFiles = fs.readdirSync(dirPath)

    acc2[svr] = {}

    for (let i = 0; i < resultFiles.length; ++i) {
      let fileName = resultFiles[i]
      let filePath = path.join(dirPath, resultFiles[i])
      let serializedResult = fs.readFileSync(filePath)

      let fileNameBase = fileName.replace(/\.json/, '')

      let result = JSON.parse(serializedResult)
      let schema = Object.keys(result[0])

      acc2[svr][fileNameBase] = {
        result,
        schema,
      }
    }

    return acc2
  }, {})

  return acc
}, {})




console.log(JSON.stringify(expectedResults,null,4))

const _getArchiveStructure = (assignment, dbServer, dirPath, cb) => {

  fs.readdir(dirPath, (err, files) => {
    if (err) {
      return cb(err)
    }

    let expected = expectedScripts[assignment][dbServer]

    let archiveData = {
      recognizedFiles   : _.intersection(expected, files),
      missingFiles      : _.difference(expected, files),
      extraFiles : _.difference(files, expected),
    }

    cb(null, archiveData)
  })
}


const _testNoExtraFiles = (extraFiles, cb) => {
  let errors = []

  if (extraFiles && extraFiles.length) {
    let fList = extraFiles.join()
    errors.push(`The following submitted files are not recognized: [${fList}].`)
  }

  if (errors.length) {
    return cb(null, { failed: errors })
  }

  cb(null, 'passed')
}



const _testSQLScript = (assignment, dbServer, submittedScriptsDir, fileName, cb) => {
  let errors = []

  let sqlFilePath = path.join(submittedScriptsDir, fileName)

  fs.readFile(sqlFilePath, 'utf8', (fsErr, query) => {
    if (fsErr) {
      // This error shouldn't happen. If it does, it's a server problem, not a SQL problem.
      logger.error(fsErr)
      return cb(null, { failed: fsErr.message })
    }

    let queryRunner = queryRunnersForAssignments[assignment][dbServer]

    queryRunner(query, (dbErr, result) => {
      if (dbErr) {
        errors.push(dbErr.message)
      } else {

        let predicate = fileName.replace(/.sql/, '')
        let schema = Object.keys(result[0])

        let expected = expectedResults[assignment][dbServer][predicate]

        let badSchema = !_.isEqual(expected.schema, schema)

        if (badSchema) {
          errors.push(`The result set has the wrong schema. The expected column names are: [${expected.schema.join()}]`)
        }

        let recognizedColumns = _.intersection(expected.schema, schema)

        let expectedForRecognizedColumns = expected.result.map(row => _.pick(row, recognizedColumns))
        let resultForRecognizedColumns = result.map(row => _.pick(row, recognizedColumns))

        if (!_.isEqual(expectedForRecognizedColumns, resultForRecognizedColumns)) {
          if (badSchema) {
            errors.push('For the result set columns that are in the expected schema, the result data is incorrect.')
          } else {
            errors.push('The result data is incorrect.')
          }
        }

      }

      if (errors.length) {
        cb(null, { failed: errors })
      } else {
        cb(null, 'passed')
      }

    })
  })
}

const _autoFailMissingFiles = (fileName, cb) =>
  cb(null, { failed: `${fileName} was not included in the ZIP archive.`})


const getTests = (assignment, dbServer, submittedScriptsDir, archiveData) => {

  let tests = {
    'No Extra Files Test': _testNoExtraFiles.bind(null, archiveData.extraFiles),
  }

  archiveData.missingFiles.reduce((acc, fileName) => {
    let testName = `Predicate ${fileName.replace(/.sql/, '')} Test`
    acc[testName] = _autoFailMissingFiles.bind(null, fileName)
    return acc
  }, tests)

  archiveData.recognizedFiles.reduce((acc, fileName) => {
    let testName = `Predicate ${fileName.replace(/.sql/, '')} Test`
    acc[testName] = _testSQLScript.bind(null, assignment, dbServer, submittedScriptsDir, fileName)
    return acc
  }, tests)

  return tests
}



const run = (assignment, dbServer, submittedScriptsDir, cb) => {
  _getArchiveStructure(assignment, dbServer, submittedScriptsDir, (err, archiveData) => {
    if (err) {
      cb(err)
    }

    let tests = getTests(assignment, dbServer, submittedScriptsDir, archiveData)

    async.parallel(tests, cb)
  })
}


module.exports = {
  run,
}
