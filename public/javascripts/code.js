(function () {
    'use strict'

    /* globals $, FormData */

    const contentDivs = [
      '#about_div',
      '#uploader_div',
    ]

    const assignments = [
      'uncle_ted_examples_1'
    ]

    let activeDiv = '#about_div'
    let activeAssignment = 'uncle_ted_examples_1'

    for (let i = 0; i < contentDivs.length; ++i) {
      if (contentDivs[i] !== activeDiv) {
        $(contentDivs[i]).hide()
      }
    }

    for (let i = 0; i < assignments.length; ++i) {
      if (assignments[i] !== activeAssignment) {
        $(`${assignments[i]}_content_div}`).hide()
      }
    }

    hideSQLFileControlButtons()

    //const systemStatusPollTimeout = 1000

    function notify (message, alertLevel) {
        alertLevel = alertLevel || 'info'

        $('#test-results-div').html(
            '<div class="alert alert-' + alertLevel + '">' +
              '<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>' + message + '<br/>' +
            '</div>'
        )
    }

    function switchActiveDiv (newActiveDiv) {
      $(activeDiv).hide()
      $(newActiveDiv).show()

      activeDiv = newActiveDiv
    }


    // Bind actions to page elements.
    $("#about_selector").bind('click', switchActiveDiv.bind(null, '#about_div'))
    $("#uploader_selector").bind('click', switchActiveDiv.bind(null, '#uploader_div'))
    $('#uploader_reset_btn_div').on('click', resetUploaderForm)

    function removeTheTestsReport () {
      $('#test-results-div').html('<div></div>')
    }

    function resetUploaderForm () {
      $("#sql_scripts_file").replaceWith($("#sql_scripts_file").clone(true))
      hideSQLFileControlButtons()
      removeTheTestsReport()
      return false
    }

    function showSQLFileControlButtons () {
      $('#uploader_send_btn_div').show()
      $('#uploader_btn_row').show()
    }

    function hideSQLFileControlButtons () {
      $('#uploader_btn_row').hide()
    }

    function hideTheSendButton () {
      $('#uploader_send_btn_div').hide()
    }

    $(':file').change(function () {
      let file = this.files[0]

      if (file.type !== "application/zip") {
        if (!$('#zip-warning').length) {
          $('#uploader_form').append(
              '<div id="zip-warning" class="alert alert-danger">' +
                  '<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>' +
                  "SQL scripts uploads must be in a .zip archive." +
              '</div>')
        }

        resetUploaderForm()
        hideSQLFileControlButtons()
      } else {
        removeTheTestsReport()
        showSQLFileControlButtons()
      }
    })

    $('#uploader_send_btn').bind('click', function () {
        postSQLScripts()
        resetUploaderForm()
        return false
    })


    const testsSorter = (a,b) => {
      a = parseInt(a.match(/\d+/))
      b = parseInt(b.match(/\d+/))

      return a-b
    }


    const generateReport = (results) => {

      let testNames = Object.keys(results).sort(testsSorter)

      let reportStart = `<div class="list-group">`

      let report = testNames.reduce((acc, testName) => {
        let testStatus = (results[testName] && results[testName].trim && results[testName].trim().toLowerCase()) || results[testName]
        let reportItem = ''


        if (testStatus === 'passed') {
          reportItem = `
            <div href="#" class="list-group-item list-group-item-success">
              <h3 class="list-group-item-heading">${testName}</h3>
              <p class="list-group-item-text">Passed</p>
            </div>`
        } else if (testStatus === 'failed') {
          reportItem = `
            <div href="#" class="list-group-item list-group-item-danger">
              <h3 class="list-group-item-heading">${testName}</h3>
              <p class="list-group-item-text">Passed</p>
            </div>`
        } else if (typeof results[testName] === 'object') {
          let state = Object.keys(testStatus)[0] // NOTE: expecting an object with a single key, 'failed', 'warning', etc
          let level = (state.trim().toLowerCase() === 'failed') ? 'danger' : 'warning'

          let msgs = testStatus[state]

          reportItem = `
            <div href="#" class="list-group-item list-group-item-${level}">
              <h3 class="list-group-item-heading">${testName}</h3>`

          if (!Array.isArray(msgs)) {
            reportItem += `<p class="list-group-item-text">${msgs}</p>`
          } else {
            reportItem += `<ul>${msgs.map(m => `<li>${m}</li>`).join('')}</ul>`
          }
          reportItem += '</div>'
        }

        return acc + reportItem
      }, reportStart)

      return `${report}</div>`
    }

    //let pendingResultsKey = null

    function postSQLScripts () {

      let formData = new FormData($("#uploader_form")[0])
      let dbServer = $('input[name=db_server]:checked', '#uploader_form').val()

      let url = `/sql-testing?assignment=${activeAssignment}&dbServer=${dbServer}`

      $.ajax({
          type : "POST",
          url  : url,
          error: function (xhr) {
            notify(xhr.responseText, 'danger')
          },
          success : function (results) {
            console.log('TODO: set prendingResultKey')
            $('#test-results-div').html(generateReport(results))
            showSQLFileControlButtons()
            hideTheSendButton()
          },
          data: formData,
          //Options to tell jQuery not to process data or worry about content-type.
          cache: false,
          contentType: false,
          processData: false
      })


      return false
    }

}())


      //let report = testNames.reduce((acc, testName) => {
        //if (results[testName].trim && (results[testName].trim().toLowerCase() === 'passed')) {
          //return acc + `<dt class="text-success">${testName}</dt><dd class="text-success">Passed</dd>`
        //} else if (results[testName].trim && (results[testName].trim().toLowerCase() === 'failed')) {
          //return acc + `<dt class="text-danger">${testName}</dt><dd class="text-danger">Failed</dd>`
        //} else if (typeof results[testName] === 'object') {
          //let d = results[testName]
          //let state = Object.keys(d)[0] // NOTE: expecting an object with a single key, 'failed', 'warning', etc
          //let level = (state.trim().toLowerCase() === 'failed') ? 'danger' : 'warning'

          //let msgs = Array.isArray(d[state]) ? d[state] : [d[state]]

          //return acc + `<dt class="text-${level}">state</dt>${msgs.map(m => `<dd class="text-${level}">${m}</dd>`).join('')}`
        //}

        //return acc
      //}, '<div class="alert" id="test_report_div"><dl>')

      //return `${report}</dl></div>`
    //}


