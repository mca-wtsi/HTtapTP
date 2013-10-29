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

  var put_results = function(results, ele) {
    ele.removeClass('loading');
    ele.addClass( results["ok"] ? 'pass' : 'fail' );
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
    ctrl.innerHTML += "<a class='raw' href='" + url + "'> Raw TAP </a>";
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
    ele.prop({ results: null });

    var url = ele.attr("data-tap-src");
    var timeout = ele.attr("data-tap-timeout-ms") || 30000;

    var qdata = GET_data(ele, {});
    qdata["id"] = ele.attr("name") || ele.attr("id");
    qdata["HTtapTP"] = version;
    qdata["timeout"] = timeout; // ms

    var fn_deliver = function(data) {
      ele.find("pre")[0].textContent = data; // HTML is quoted for us

      var parser = tp();
      parser.on("results", function (results) {
        put_results(results, ele);
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
          errorThrown += "\nSuspected by httaptp.js: CORS blocking in browser";
        }
      }
      var bogo_doc = "not ok 1 - " + textStatus + " while fetching " + url
        + "\n# " + errorThrown;
      // textStatus could be "error", "timeout" ...
      fn_deliver(bogo_doc);
    };

    ele.prop('jqXHR', $.ajax({
      url: url,
      type: "GET",
      dataType: "text",
      timeout: timeout, // ms
      data: qdata,
      success: fn_deliver,
      error: fn_error,
      // any non-simple headers may provoke CORS preflight check
      headers: { cookie: null },
      xhrFields: { withCredentials: false }, // browser cookies are being passed...?  this doesn't stop them
    }));
  };

  var fetch_tap = function(got_with, ele) {
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

  return {
    load_to_doc: load_to_doc,
    fetch_tap: fetch_tap,
    version: version,
    ctrl: control_fns,
  };
});
