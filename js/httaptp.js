define(

"httaptp", // name of module

[       'jquery', 'tap-parser' ], // array of dependencies
function($,        tp) {
  "use strict";

  var put_results = function(results, ele) {
    console.log("Results from " + ele.attr("data-tap-src"));
    ele.removeClass('loading');
    ele.addClass( results["ok"] ? 'pass' : 'fail' );
  };
  };

  var fetch_tap = function(ele) {
    var parser = tp();
    parser.on("results", function (results) {
      put_results(results, ele);
    });

    ele[0].innerHTML = "<pre> Loading ... </pre><div class='control'>\
  <button> Cancel </button>\
  <button> Show </button>\
</div>";
    ele.addClass('loading');

    var url = ele.attr("data-tap-src");

    var hdrs = {
      "X-HTtapTP-Name": // "name" from @name || @id
          ele.attr("name") || ele.attr("id"),
    };

    var fn_deliver = function(data) {
      ele.find("pre")[0].textContent = data; // HTML is quoted for us
      parser.write(data);
      parser.end();
    };
    var fn_error = function(jqXHR, textStatus, errorThrown) {
      var bogo_doc = "not ok 1 - " + textStatus + " while fetching " + url
        + "\n# " + errorThrown;
      // textStatus could be "error", "timeout" ...
      fn_deliver(bogo_doc);
    };

    $.ajax({
      url: url,
      type: "GET",
      dataType: "text",
      timeout: 30000, // ms
      headers: hdrs,
      success: fn_deliver,
      error: fn_error,
    });
  };

  var load_to_doc = function(selector) {
    var sel_all = $( selector );
    for (var i=0; i < sel_all.length; i++) {
      fetch_tap( sel_all.eq(i) );
    }
  };

  return { load_to_doc: load_to_doc, fetch_tap: fetch_tap };
});
