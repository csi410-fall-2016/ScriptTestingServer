'use strict'


const fs = require('fs')
const path = require('path')
const async = require('async')
const rmdir = require('rmdir')

const unzip = require('unzip')

const logger = require('../logger')


const moveUpOneDir = (archiveDir, fileName, cb) => {
  let s = archiveDir.split('/')

  let d = s.slice(0, -1).filter(f=>f)

  d.unshift('/')

  d.push(fileName)

  let oldPath = path.join(archiveDir, fileName)
  let newPath = path.join.apply(null, d)

  fs.rename(oldPath, newPath, cb)
}


const flattenIfNecessary = (extractDir, cb) => {
  fs.readdir(extractDir, (err1, files1) => {
    if (err1) {
      return cb(err1)
    }

    if (files1.length === 1) {
      let dirName = files1[0]
      let dpath = path.join(extractDir, dirName)

      fs.lstat(dpath, (err2, stats) => {
        if (err2) {
          return cb(err2)
        }

        if (!stats.isDirectory()) {
          return cb(null)
        }

        if (stats.isDirectory()) {
          return fs.readdir(dpath, (err3, files) => {
            if (err3) {
              return cb(err3)
            }

            let archiveDir = path.join(extractDir, dirName)
            let flattener = moveUpOneDir.bind(null, archiveDir)

            return async.each(files, flattener, (err4) => {
              if (err4) {
                return cb(err4)
              }

              rmdir(archiveDir, (err5) => {
                if (err5) {
                  console.error(err5)
                  logger.error(err5)
                }

                cb(null)
              })
            })
          })
        }
      })
    }
  })
}


const extract = (filePath, cb) => {

  try {
    // Extract dir has same name as archive file, without the .zip.
    const extractDir = filePath.replace(/.zip/, '')

    fs.createReadStream(filePath)
      .pipe(unzip.Extract({ path: extractDir }))
      .on('error', cb)
      .on('close', () => {
        fs.unlink(filePath, (err1) => {
          if (err1) {
            return cb(err1)
          }

          flattenIfNecessary(extractDir, (err2) => {
            if (err2) {
              return cb(err2)
            }

            return cb(null, extractDir)
          })
        })
      })

  } catch (err) {
    return cb(err)
  }
}


module.exports = {
  extract,
}
