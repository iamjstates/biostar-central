// using jQuery
function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie != '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

csrftoken = getCookie('csrftoken');

function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

$.ajaxSetup({
    crossDomain: false, // obviates need for sameOrigin test
    beforeSend: function (xhr, settings) {
        if (!csrfSafeMethod(settings.type)) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        }
    }
});

// comment add
function user_comment_click(elem) {

    // remove comment body if exists.
    $("#comment-form").remove();

    var post_id = elem.attr('data-value')
    var container = elem.closest("table")

    var csrf_html = $('#csrf_token').find("input[name='csrfmiddlewaretoken']").parent().html()

    container.append('<tr id="comment-form"><td colspan="2">\
    <form role="form" action="/p/new/comment/' + post_id + '/" method="post">' + csrf_html + '\
        <div class="form-group">\
        <textarea class="input-xlarge span8" id="comment-box" name="content" rows="3"></textarea></div> \
        <div><a class="btn btn-success" href=\'javascript:document.forms["comment-form"].submit()\'><i class="icon-comment"></i> Add comment</a>          \
        <a class="btn btn-warning pull-right" onclick="javascript:obj=$(\'#comment-form\').remove();"><i class="icon-remove"></i> Cancel</a>   </div>       \
    </form>            \
    </td></tr>'
    )
    CKEDITOR.replace('comment-box', {
        customConfig: '/static/ck_config.js'
    });
}

// modifies the votecount value
function mod_votecount(elem, k) {
    count = parseInt(elem.siblings('.count').text()) || 0
    count += k
    elem.siblings('.count').text(count)
}

function anon_comment_click(elem) {
    container = elem.closest("table")
    elem.css("background-color", "red");
    $("#comment-box").remove();
    container.append('<tr id="comment-box">\
    <td colspan="2">\
        <div class="alert alert-warning">Please log in to comment</div>\
    </td></tr>'
    )

}

function toggle_button(elem, type) {
    // Toggles the state of the buttons and updates the label messages

    if (elem.hasClass('off')) {
        elem.removeClass('off');
        if (type == "vote") {
            mod_votecount(elem, 1)
        }
    } else {
        elem.addClass('off');
        if (type == "vote") {
            mod_votecount(elem, -1)
        }
    }
}

function pop_over(elem, msg, cls) {
    var text = '<div></div>'
    var tag = $(text).insertAfter(elem)
    tag.addClass('vote-popover ' + cls)
    tag.text(msg)
    tag.delay(1000).fadeOut(1000, function () {
        $(this).remove()
    });
}

function ajax_vote(elem, post_id, type) {
    // Pre-emptitively toggle the button to provide feedback
    toggle_button(elem, type)

    $.ajax('/x/vote/', {
        type: 'POST',
        dataType: 'json',
        data: {post_id: post_id, post_type: type},
        success: function (data) {
            if (data.status == 'error') { // Soft failure, like not logged in
                pop_over(elem, data.msg, data.status) // Display popover only if there was an error
                toggle_button(elem, type) // Untoggle the button if there was an error
            } else {
                //pop_over(elem, data.msg, data.status)
            }

        },
        error: function () { // Hard failure, like network error
            pop_over(elem, 'Unable to submit vote!', 'error');
            toggle_button(elem, type);
        }
    });
}

$(document).ready(function () {
    var tooltip_options = {};

    // This detects the user id
    var user_id = $("#user_id").val()

    // Register tooltips.
    $('.tip').tooltip(tooltip_options)

    // Register comment adding.
    if (user_id) {
        $('.add-comment').each(function () {
            $(this).click(function () {
                user_comment_click($(this));
            });
        });
    } else {
        $('.add-comment').each(function () {
            $(this).click(function () {
                anon_comment_click($(this));
            });
        });
    }

    $('.vote').each(function () {

        $($(this)).click(function () {
            var elem = $(this);
            var post_id = elem.parent().attr('data-post_id');
            var type = elem.attr('data-type')
            ajax_vote(elem, post_id, type);
        });
    });


});
