
// As suggested at http://requirejs.org/docs/jquery.html
require.config({
    baseUrl: '/otter-web-utils/webtap/scripts/',
    paths: {
        jquery: 'jquery-1.10.2.min',
    }
});

require([ 'jquery', 'tap-parser--browserified' ],
function  ($,        tp) {
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

    var hdrs = { "X-WebTAP-Name": ele_name };

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

  $("pre.tap").each(function() { fetch_tap(this) });
});
