'use strict'


const path    = require('path')

const express = require('express')
const router  = express.Router()

const multer  = require('multer')
const shortid = require('shortid')

const mkdirp  = require('mkdirp')

const logger = require('../src/logger')


const sqlTestingController = require('../src/controllers/sqlTestingController')

const uploadDir = path.join(__dirname, '../tmp/uploads/')

mkdirp.sync(uploadDir)


const sqlScriptsMulterStorage = multer.diskStorage({

  destination: uploadDir,

  filename: function (req, file, cb) {

    let filename = `${file.originalname}-${Date.now()}-${shortid.generate()}.zip`

    logger.info({
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      filename,
    })

    cb(null, filename)
  },
})


// FIXME: Is there a way with multer to specify a single file upload without specifying its name?
const sqlScriptsMulter = multer({ storage: sqlScriptsMulterStorage }).single('zipfile')


//================ Config POST endpoints ================\\

const fileExtractor = (req, res, next) => {

  sqlScriptsMulter(req, res, (err) => {
    if (err) {
      return res.status(500).send("Server error while updating the SQL scripts.")
    } else {
      next()
    }
  })
}


router.post('/', fileExtractor, sqlTestingController)


module.exports = router
