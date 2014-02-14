define(

"httaptp", // name of module

[       'jquery', 'tap-parser' ], // array of dependencies
function($,        tp) {
  "use strict";

  var version = "0.05"; // XXX: not synced from Git

  var GET_data = function(ele, data) {
    var txt = ele.attr("data-tap-data");
    if (txt) {
        var more;
        try {
            more = $.parseJSON(txt);
        } catch (e) {
            more = { bad_JSON: e }; // as an error handler, it is minimal
        }
        $.extend(data, more);
    }
    // handling of parents for GET data might need to change,
    // e.g. does it see <col> ?
    var up = ele.parents("[data-tap-data]");
    if (up[0]) {
        return GET_data(up.eq(0), data);
    } else {
        return data;
    }
  };

  var put_results = function(results, ele, xfer_status) {
    ele.removeClass('loading');
    var ok = results["ok"];

    // deal with variations on plain pass,fail
    if (results.plan && results.plan.skip_all) {
      ele.addClass('skip');
    } else if (results.fail.length == 0 &&
        results.todo && results.todo.length) {
      ele.addClass('todo');
      // downgrade the pass if the failing items are all todo
      // (by default the suite just passes)
      for(var i=0; i<results.todo.length; i++) {
        ok &= results.todo[i].ok;
      }
    }
    ele.addClass( ok ? 'pass' : 'fail' );

// call something to obtain the pass+fail line numbers from the result,
// then colour the text.

    if (xfer_status == 'success') {
      // arg from jqXHR, tells only of transfer success
      xfer_status = undefined;
    } else {
      ele.addClass('xfer'); // generic transfer problem
    }
  };

  var control_fns = {
    Show: function(ele, ev) {
      var showing = ele.hasClass("show");
      $( ele.prop('selector') ).removeClass("show"); // unshow all
      if (!showing) {
        ele.addClass("show");
      }
    },
    Log: function(ele, ev) {
      console.dir({ url: ele.attr("data-tap-src"),
                    results: ele.prop("results") });
    },
    Cancel: function(ele, ev) {
      ele.prop('jqXHR').abort();
    },
    Reload: function(ele, ev) {
      ele.prop('jqXHR').abort();
      tap_load_parse(ele);
    },
  };

  var add_controls = function(ele, btns) {
    ele[0].innerHTML = "<pre></pre><div class='control'></div>";
    var ctrl = ele.find("div.control")[0];
    for(var i=0; i<btns.length; i++) {
      ctrl.innerHTML += "<button data-op='" + btns[i] + "' type='button'>"
        + btns[i] + "</button>\n";
    }
    var url = ele.attr("data-tap-src");
    var ln = "<a class='raw' href='" + url + "'> Raw TAP </a>";
    var id = ele.attr("name") || ele.attr("id");
    if (id) {
      ln += " | <a class='anchor' href='#" + id + "'> Link this </a>";
    }
    ctrl.innerHTML += "<span class='ctrl_ln'>" + ln + "</span>";
    ele.find("div.control button").on("click", { ele: ele }, control_ev);
  };

  var control_ev = function(ev){
    var op = this.firstChild.textContent;
    var fn = control_fns[op];
    var ele = ev.data.ele;
    if (fn) {
      fn(ele, ev);
    } else { // no code for this button (oops)
      $(this).attr("disabled", "disabled");
    }
    return false;
  };

  var tap_load_parse = function(ele) {
    ele.addClass('loading');
    ele.find("pre")[0].innerHTML = ' Loading ... ';
    ele.removeClass('pass');
    ele.removeClass('fail');
    ele.removeClass('xfer');
    ele.removeClass('skip');
    ele.removeClass('todo');
    ele.prop({ results: null });

    var url = ele.attr("data-tap-src");

    // Collect GET data from DOM, with defaults
    var qdata = GET_data(ele, {
      timeout: 30000, // millisec
    });
    // Override some keys
    qdata["id"] = ele.attr("name") || ele.attr("id");
    qdata["HTtapTP"] = version;

    var fn_deliver = function(data, xfer_status) {
      ele.find("pre")[0].textContent = data; // HTML is quoted for us
      var parser = tp();
      parser.on("results", function (results) {
        put_results(results, ele, xfer_status);
        ele.prop('results', results);
      });

      parser.write(data);
      parser.end();
    };
    var fn_error = function(jqXHR, textStatus, errorThrown) {
      if (textStatus == 'error') {
        if (jqXHR.status == 0 || jqXHR.getAllResponseHeaders() == "") {
          // This is rule of thumb, based on
          // http://www.html5rocks.com/en/tutorials/cors/#toc-known-bugs
          //
          // No error information provided [...] it can be confusing
          // when trying to debug why CORS requests are failing.
// it isn't this if we see a Server: or Date: header..?
          errorThrown += "\nSuspected by httaptp.js: CORS blocking in browser";
        }
      }
      var bogo_doc = "not ok 1 - " + textStatus + " while fetching " + url
        + "\n# " + errorThrown;
      // textStatus could be "error", "timeout" ...
      fn_deliver(bogo_doc, textStatus);
    };

    var timeout = parseInt(qdata["timeout"], 10);
    ele.prop('jqXHR', $.ajax({
      url: url,
      type: "GET",
      dataType: "text",
      timeout: timeout, // ms
      data: qdata,
// can we get progressive fetching,
// allowing incremental or repeat-at-intervals parsing?
      success: fn_deliver,
      error: fn_error,
      // any non-simple headers may provoke CORS preflight check
      headers: { cookie: null },
      xhrFields: { withCredentials: false }, // browser cookies are being passed...?  this doesn't stop them
    }));
  };

  var fetch_tap = function(got_with, ele) {
    var url = ele.attr("data-tap-src");
    if (url === undefined || url === "") {
      // No source.  We are either running on the wrong thing, or it
      // is part of ol.tap-key
      return;
    }
    ele.prop('selector', got_with);
    add_controls(ele, [ 'Show', 'Cancel', 'Reload', 'Log' ]);
    tap_load_parse(ele);
  };

  var load_to_doc = function(selector) {
    var sel_all = $( selector );
    for (var i=0; i < sel_all.length; i++) {
      fetch_tap(selector, sel_all.eq(i));
    }
  };

  var show_key_in_doc = function(selector) {
    var sel_all = $( selector ).eq(0);
    if (sel_all.length == 0) return;
    sel_all[0].innerHTML +=
      '<ol>' +
      ' <li class="loading"> Waiting <span>for results</span> </li>' +
      ' <li class="pass"> Pass </li>' +
      ' <li class="pass skip"> Skip all <span>(weak pass)</span> </li>' +
      ' <li class="pass todo"> Pass, TODO <span>(unexpected pass)</span> </li>' +
      ' <li class="fail todo"> Fail, TODO <span>(weak fail)</span> </li>' +
      ' <li class="fail"> Fail </li>' +
      ' <li class="fail xfer"> Transfer failed </li>' +
      ' <li class="key-frag-hi"> This one </li>' +
      '</ol> <small> nb. TODO in subtest may not show up </small>';
    sel_all.find("li").attr("data-tap-src", "");
  };

  return {
    load_to_doc: load_to_doc,
    show_key_in_doc: show_key_in_doc,
    fetch_tap: fetch_tap,
    version: version,
    ctrl: control_fns,
  };
});
