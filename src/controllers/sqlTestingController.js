'use strict'

const path = require('path')

const logger = require('../logger')

const extract = require('../services/ZIPFileService').extract
const runTests = require('../services/sqlTestingService').run

const uploadDir = path.join(__dirname, '../../tmp/uploads/')


const controller = (req, res) => {
  const filename = req.file && req.file.filename
  const dbServer = req.query.dbServer && req.query.dbServer.toLowerCase()
  const assignment = req.query.assignment && req.query.assignment.toLowerCase()

  if (!filename) {
    return res.status(500).send('Error uploading the file. No filename passed to the controller.')
  }

  const filePath = path.join(uploadDir, filename)

console.log('####: start')
  extract(filePath, (err, xDirPath) => {
    if (err) {
      logger.error(err)
      return res.status(500).send(err.message)
    }

    runTests(assignment, dbServer, xDirPath, (err2, results) => {
      if (err2) {
        console.error(err2.stack)
        logger.error(err2)
        return res.status(500).send(err2.message)
      }

console.log('================================')
console.log(JSON.stringify(results, null, 4))
      return res.send(results)
    })
  })
}


module.exports = controller
