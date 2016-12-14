#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const async = require('async')
const mkdirp = require('mkdirp')


const NUM_TRANSACTIONS = 10000

const DBService = require('../../src/services/postgresService')
const DBName = require('../../src/constants/databases').LEARNING_SQL
const queryRunner = DBService.databaseQueryRunners[DBName]

const dataDir = path.join(__dirname, '../../data/learningSQL/')
const outFilePath = path.join(dataDir, 'transaction.csv')

mkdirp.sync(dataDir)

/*
	SELECT account_id, customer.cust_id, city, state
	FROM account, customer
	WHERE account.cust_id = customer.cust_id;
*/

const getAccountIDs = (cb) => {
  let q = "SELECT account_id FROM account;"

  return queryRunner(q, (err, result) => {
    if (err) {
      return cb(err)
    }

    let account_ids = result.rows.reduce((acc, row) => {
      acc.push(row.account_id)
      return acc
    }, [])

    return cb(null, account_ids)
  })
}

/*
	SELECT branch_id, cust_id
	FROM branch,customer
	WHERE branch.state = customer.state
	ORDER BY branch_id, cust_id;
*/

const getBranchIDs = (cb) => {
  let q = "SELECT branch_id FROM branch WHERE name <> 'Headquarters';"

  return queryRunner(q, (err, result) => {
    if (err) {
      return cb(err)
    }

    let branch_ids = result.rows.reduce((acc, row) => {
      acc.push(row.branch_id)
      return acc
    }, [])

    return cb(null, branch_ids)
  })
}

const getTellerIDs = (cb) => {
  let q = "SELECT emp_id FROM employee WHERE title LIKE '%Teller%';"

  return queryRunner(q, (err, result) => {
    if (err) {
      return cb(err)
    }

    let emp_ids = result.rows.reduce((acc, row) => {
      acc.push(row.emp_id)
      return acc
    }, [])

    return cb(null, emp_ids)
  })
}


const preliminaryTasks = {
  account_ids : getAccountIDs,
  branch_ids  : getBranchIDs,
  teller_ids  : getTellerIDs,
}


async.parallel(preliminaryTasks, (err, results) => {

  if (err) {
    throw err
  }

  let account_ids    = results.account_ids
  let branch_ids = results.branch_ids
  let teller_ids = results.teller_ids

  const txns_data = []
  for (let i = 1; i <= NUM_TRANSACTIONS; ++i) {

    let y, m, d
    let txn_id = i

    let txn_date = new Date()
    txn_date.setDate(txn_date.getDate() - (365 * Math.random()))

    y = txn_date.getFullYear()
    m = `0${txn_date.getMonth() + 1}`.slice(0,2)
    d = `0${txn_date.getDate()}`.slice(0,2)

    let txn_date_str = `${y}-${m}-${d}`

    let account_id = account_ids[Math.floor(Math.random() * account_ids.length)]

    let txn_type_cd = (Math.random() < 0.5) ? 'CDT' : 'DBT'

    let amount = (Math.random() * 100).toFixed(2)

    let is_teller_txn = ((account_id === 7) || (Math.random() < 0.75))

    let teller_emp_id = is_teller_txn ? teller_ids[Math.floor(Math.random() * teller_ids.length)] : null

    let execution_branch_id = is_teller_txn ? branch_ids[Math.floor(Math.random() * branch_ids.length)] : null

    let funds_avail_date = new Date(txn_date)
    funds_avail_date.setDate(txn_date.getDate() + Math.floor((2 * Math.random())))

    y = funds_avail_date.getFullYear()
    m = `0${funds_avail_date.getMonth() + 1}`.slice(0,2)
    d = `0${funds_avail_date.getDate()}`.slice(0,2)

    let funds_avail_date_str = `${y}-${m}-${d}`

    let txn = `${txn_id},${txn_date_str},${account_id},${txn_type_cd},${amount},${teller_emp_id},${execution_branch_id},${funds_avail_date_str}`

    txns_data.push(txn)
  }

  fs.writeFileSync(outFilePath, txns_data.join('\n'))

  DBService.end()
})



