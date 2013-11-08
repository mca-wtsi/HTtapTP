
// As suggested at http://requirejs.org/docs/jquery.html
require.config({
    paths: {
        jquery: '../ext-js/jquery-1.10.2.min',
        'tap-parser': '../ext-js/tap-parser--browserified',
        httaptp: 'httaptp'
    }
});

require([ 'httaptp' ],
function  (httaptp) {
  httaptp.show_key_in_doc("div.tap-key");
  httaptp.load_to_doc("[data-tap-src]");
});
