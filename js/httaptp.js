define(

"httaptp", // name of module

[       'jquery', 'tap-parser' ], // array of dependencies
function($,        tp) {
  "use strict";

  var put_results = function(results, ele) {
    console.log("Results from " + ele.attributes["data-tap-src"].value);
    ele.classList.add( results["ok"] ? 'pass' : 'fail' );
    // ele.textContent += "\n\n" + JSON.stringify(results);
  };

  var fetch_tap = function(ele) {
    var parser = tp();
    parser.on("results", function (results) {
      put_results(results, ele);
    });

    var url = ele.attributes["data-tap-src"].value;

    // "name" from @name || @id
    var ele_name = ele.attributes["name"];
    ele_name = ele_name ? ele_name.value : ele.id;

    var hdrs = { "X-HTtapTP-Name": ele_name };

    var fn_deliver = function(data) {
      ele.textContent = data; // HTML is quoted for us
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
    $(selector).each(function() { fetch_tap(this) });
  };

  return { load_to_doc: load_to_doc, fetch_tap: fetch_tap };
};
