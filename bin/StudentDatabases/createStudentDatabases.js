#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')
const shortid = require('shortid')

const mysqlScriptDir = path.join(__dirname, '../../dbScripts/createStudentDatabases/mysql')
const postgresScriptDir = path.join(__dirname, '../../dbScripts/createStudentDatabases/postgres')
const emailMsgsDir = path.join(__dirname, '../../dbScripts/createStudentDatabases/emails')

mkdirp.sync(mysqlScriptDir)
mkdirp.sync(postgresScriptDir)
mkdirp.sync(emailMsgsDir)

const classlist = require('../../src/constants/classlist')
const usernames = Object.keys(classlist)

const tempPasswords = usernames.reduce((acc, username) => {
  acc[username] = shortid.generate()
  return acc
}, {})


const emailTemplatePath = path.join(__dirname, './emailTemplate.txt')
const emailTemplate = fs.readFileSync(emailTemplatePath, 'ascii')

for (let i = 0; i < usernames.length; ++i) {

  let netid = usernames[i]
  let fname = classlist[netid].fname
  let passwd = tempPasswords[netid]
  let ename = classlist[netid].email.replace(/\@.*/, '')

  let emailMsg = emailTemplate.replace(/__NAME__/, fname)
                              .replace(/__PASSWD__/, passwd)
                              .replace(/__NETID__/, netid)

  let outFilePath = path.join(emailMsgsDir, ename)

  fs.writeFileSync(outFilePath, emailMsg)
}


const mysqlPrivileges = [
  'ALTER',
  'ALTER ROUTINE',
  'CREATE',
  'CREATE ROUTINE',
  'CREATE TEMPORARY TABLES',
  'CREATE VIEW',
  'DELETE',
  'DROP',
  'EVENT',
  'EXECUTE',
  'INDEX',
  'INSERT',
  'LOCK TABLES',
  'REFERENCES',
  'SELECT',
  'SHOW VIEW',
  'TRIGGER',
  'UPDATE'
].join()

const createMySQLStatementsForUser = (username) =>
`DROP USER IF EXISTS ${username};
CREATE USER '${username}'@'%' IDENTIFIED BY '${tempPasswords[username]}';
GRANT USAGE ON *.* TO '${username}'@'%' IDENTIFIED BY '${tempPasswords[username]}';
GRANT USAGE ON *.* TO '${username}'@'localhost' IDENTIFIED BY '${tempPasswords[username]}';
DROP DATABASE IF EXISTS ${username};
CREATE DATABASE ${username};
GRANT SELECT ON learning_sql.* TO '${username}'@'%';
GRANT SELECT ON uncle_ted_sample.* TO '${username}'@'%';
GRANT ${mysqlPrivileges} ON ${username}.* TO '${username}'@'%' IDENTIFIED BY '${tempPasswords[username]}';`

const mysqlScriptStatements = usernames.reduce((acc, username) => {
  acc.push(createMySQLStatementsForUser(username))
  return acc
}, [])

const mysqlScript = `USE mysql;\n\n` + mysqlScriptStatements.join('\n\n')

const mysqlScriptPath = path.join(mysqlScriptDir, 'createStudentDatabases.sql')
fs.writeFileSync(mysqlScriptPath, mysqlScript)


const createPostgresStatementsForUser = (username) =>
`DROP DATABASE IF EXISTS ${username};
CREATE DATABASE ${username};
REVOKE ALL PRIVILEGES ON DATABASE ${username} FROM public;

\\c uncle_ted_sample
DROP OWNED BY ${username} CASCADE;

\\c learning_sql
DROP OWNED BY ${username} CASCADE;

\\c postgres
DROP USER IF EXISTS ${username};
CREATE ROLE ${username} LOGIN ENCRYPTED PASSWORD '${tempPasswords[username]}';
GRANT CONNECT, CREATE ON DATABASE ${username} to ${username};

\\c learning_sql
GRANT SELECT ON account TO ${username};;
GRANT SELECT ON branch TO ${username};;
GRANT SELECT ON business TO ${username};;
GRANT SELECT ON customer TO ${username};;
GRANT SELECT ON department TO ${username};;
GRANT SELECT ON employee TO ${username};;
GRANT SELECT ON individual TO ${username};;
GRANT SELECT ON officer TO ${username};;
GRANT SELECT ON product TO ${username};;
GRANT SELECT ON product_type TO ${username};;
GRANT SELECT ON transaction TO ${username};;


\\c uncle_ted_sample
GRANT SELECT ON course TO ${username};;
GRANT SELECT ON department TO ${username};;
GRANT SELECT ON faculty TO ${username};;
GRANT SELECT ON section TO ${username};;

\\c postgres
`


const postresScriptStatements = usernames.reduce((acc, username) => {
  acc.push(createPostgresStatementsForUser(username))
  return acc
}, [])


const postgresScript = postresScriptStatements.join('\n\n')

const postgresScriptPath = path.join(postgresScriptDir, 'createStudentDatabases.sql')
fs.writeFileSync(postgresScriptPath, postgresScript)

