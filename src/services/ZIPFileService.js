'use strict'


const fs = require('fs')

const unzip = require('unzip')


const extract = (filePath, cb) => {

  try {
    // Extract dir has same name as archive file, without the .zip.
    const extractDir = filePath.replace(/.zip/, '')

    fs.createReadStream(filePath)
      .pipe(unzip.Extract({ path: extractDir }))
      .on('error', cb)
      .on('close', () => {
        fs.unlink(filePath, (err) => {
          if (err) {
            return cb(err)
          } else {
            return cb(null, extractDir)
          }
        })
      })
  } catch (err) {
    return cb(err)
  }
}


module.exports = {
  extract,
}
