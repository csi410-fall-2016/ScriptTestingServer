const databases = require('./databases')
const LEARNING_SQL = databases.LEARNING_SQL
const UNCLE_TED_SAMPLE = databases.UNCLE_TED_SAMPLE
const CDTA_GTFS = databases.CDTA_GTFS

// Assignment names should be all lower case
// Subdirectories of solutions/ should match these names.
module.exports = {
  practice_assignment_1: LEARNING_SQL,
  uncle_ted_examples_1: UNCLE_TED_SAMPLE,
  uncle_ted_examples_2: UNCLE_TED_SAMPLE,
  homework_assignment_1: LEARNING_SQL,
  homework_assignment_2: LEARNING_SQL,
  homework_assignment_5: CDTA_GTFS,
}
