'use strict'

const fs = require('fs')
const path = require('path')
const _ = require('lodash')
const async = require('async')


const logger = require('../logger')

const databaseServers = require('../constants/databaseServers')
const dbServerNames = Object.keys(databaseServers).map(svr => databaseServers[svr])

const POSTGRES = databaseServers.POSTGRES

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

      if (svr === POSTGRES) {
        result = result.rows
      }

      let schema = Object.keys(result[0]).sort()

      acc2[svr][fileNameBase] = {
        result,
        schema,
      }
    }

    return acc2
  }, {})

  return acc
}, {})


const testingRules = assignmentNames.reduce((acc, assignment) => {

  try {
    let rulesPath = path.join(solutionsDir, assignment, 'rules.json')

    let rulesJSON = fs.readFileSync(rulesPath, 'utf8')

    acc[assignment] = JSON.parse(rulesJSON)
  } finally {
    return acc
  }

}, {})



const fileSorter = (a,b) => {
  a = parseInt(a.match(/\d+/))
  b = parseInt(b.match(/\d+/))

  return a-b
}


const _getArchiveStructure = (assignment, dbServer, dirPath, cb) => {

  fs.readdir(dirPath, (err, files) => {
    if (err) {
      return cb(err)
    }

    let expected = expectedScripts[assignment][dbServer]

    let archiveData = {
      recognizedFiles: _.intersection(expected, files).sort(fileSorter),
      missingFiles: _.difference(expected, files),
      extraFiles: _.difference(files, expected),
    }

    cb(null, archiveData)
  })
}


const _testZipArchiveStructure = (extraFiles, cb) => {
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

    query = query.replace(/^\uFEFF/, '') // Remove the byte order mark (pgadmin3 issue)

    let queryRunner = queryRunnersForAssignments[assignment][dbServer]

    queryRunner(query, (dbErr, result) => {
      if (dbErr) {
        errors.push(dbErr.message)
      } else {

        try {
          if (dbServer === POSTGRES) {
            result = result && result.rows
          }

          if (!(result && result[0])) {
            errors.push('Empty response from the database.')
          } else {

            result = JSON.parse(JSON.stringify(result))


            let questionNumber = fileName.replace(/.sql/, '')
            let schema = Object.keys(result[0]).sort()

            let expected = expectedResults[assignment][dbServer][questionNumber]

            let badSchema = !_.isEqual(expected.schema, schema)

            if (badSchema) {
              errors.push('The result set has the wrong schema. ' +
                          `The expected column names are: [${expected.schema.join()}]`)
            }

            let recognizedColumns = _.intersection(expected.schema, schema)

            let expectedForRecognizedColumns = expected.result.map(row => _.pick(row, recognizedColumns))
            let resultForRecognizedColumns = result.map(row => _.pick(row, recognizedColumns))

            let rules = (testingRules[assignment] && testingRules[assignment][questionNumber]) || {}
            let badResult

            if (rules.order_matters) {
              badResult = !_.isEqual(expectedForRecognizedColumns, resultForRecognizedColumns)
            } else {
              // Testing equality by set differences
              let leftDiff = _.differenceWith(expectedForRecognizedColumns,
                                              resultForRecognizedColumns,
                                              _.isEqual)

              let rightDiff = _.differenceWith(resultForRecognizedColumns,
                                               expectedForRecognizedColumns,
                                               _.isEqual)

              badResult = !!(leftDiff.length + rightDiff.length)
            }

            if (badResult) {
              if (badSchema) {
                errors.push('For the result set columns that are in the expected schema, ' +
                            'the result data is incorrect.')
              } else {
                errors.push('The result data is incorrect.')
              }
            }

          }

        } catch (e) {
          errors.push(e.message)
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
    'Zip Archive Structure Test': _testZipArchiveStructure.bind(null, archiveData.extraFiles),
  }

  archiveData.missingFiles.reduce((acc, fileName) => {
    let testName = `Query ${fileName.replace(/.sql/, '')} Test`
    acc[testName] = _autoFailMissingFiles.bind(null, fileName)
    return acc
  }, tests)

  archiveData.recognizedFiles.reduce((acc, fileName) => {
    let testName = `Query ${fileName.replace(/.sql/, '')} Test`
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
