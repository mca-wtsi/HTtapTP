
// As suggested at http://requirejs.org/docs/jquery.html
require.config({
    baseUrl: '..',
    paths: {
        jquery: 'ext-js/jquery-1.10.2.min',
        'tap-parser': 'ext-js/tap-parser--browserified',
        httaptp: 'js/httaptp'
    }
});

require([ 'httaptp' ],
function  (httaptp) {
  httaptp.load_to_doc("div[data-tap-src]");
});
