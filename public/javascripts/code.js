(function () {
    'use strict'

    /* globals $, FormData */

    const contentDivs = [
      '#about_div',
      '#uploader_div',
    ]

    const assignments = [
      'practice_assignment_1'
    ]

    let activeDiv = '#about_div'
    let activeAssignment = 'practice_assignment_1'

    for (let i = 0; i < contentDivs.length; ++i) {
      if (contentDivs[i] !== activeDiv) {
        $(contentDivs[i]).hide()
      }
    }

    for (let i = 0; i < assignments.length; ++i) {
      if (assignments[i] !== activeAssignment) {
        $(assignments[i]).hide()
      }
    }

    hideSQLFileControlButtons()

    //const systemStatusPollTimeout = 1000

    //function notify(pane, message, alertLevel) {
        //alertLevel = alertLevel || 'info'

        //$('#' + pane + '_notifications_div').prepend(
                //'<div class="alert alert-' + alertLevel + '">' +
                    //'<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>' +
                    //message + '<br/>Go to the SystemHealth pane for more details.' +
                //'</div>')
    //}

    function switchActiveDiv (newActiveDiv) {
      $(activeDiv).hide()
      $(newActiveDiv).show()

      activeDiv = newActiveDiv
    }


    // Bind actions to page elements.
    $("#about_selector").bind('click', switchActiveDiv.bind(null, '#about_div'))
    $("#uploader_selector").bind('click', switchActiveDiv.bind(null, '#uploader_div'))
    $('#uploader_reset_btn_div').on('click', resetUploaderForm)


    function resetUploaderForm () {
      $("#sql_scripts_file").replaceWith($("#sql_scripts_file").clone(true))
      return false
    }

    function showSQLFileControlButtons () {
      $('#uploader_btn_row').show()
    }

    function hideSQLFileControlButtons () {
      $('#uploader_btn_row').hide()
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
      } else {
        showSQLFileControlButtons()
      }
    })

    $('#uploader_send_btn').bind('click', function () {
        postSQLScripts()
        resetUploaderForm()
        return false
    })


    //let pendingResultsKey = null

    function postSQLScripts () {

      let formData = new FormData($("#uploader_form")[0])
      let dbServer = $('input[name=db_server]:checked', '#uploader_form').val()

      let url = `/sql-testing?assignment=${activeAssignment}&dbServer=${dbServer}`

      $.ajax({
          type : "POST",
          url  : url,
          //error: function (xhr) {
              ////notify('GTFS-Realtime', xhr.responseText, 'danger')
          //},
          success : function (response) {
            console.log('TODO: set prendingResultKey')
            console.log(response)
            $('#test-results-div').append('<dl>' + response + '</dl>')
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
