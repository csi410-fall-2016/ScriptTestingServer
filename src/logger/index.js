'use strict'

const path = require('path')
const bunyan = require('bunyan')
const mkdirp = require('mkdirp')


const logDir = path.join(__dirname, '../../log/')

mkdirp.sync(logDir)

const logPath = path.join(logDir, 'server.log')


const log = bunyan.createLogger({
  name: 'server-logger',
  streams: [{
    type: 'rotating-file',
    path: logPath,
    period: '1d',   // daily rotation
    count: 14       // keep 14 back copies
  }]
})

module.exports = log
