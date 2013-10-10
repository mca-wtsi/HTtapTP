#! perl

use strict;
use warnings;

use Test::HTtapTP;
use Test::More;

ok(1, "true");
diag "this is diag", "it goes on a bit", "but could be useful";
warn "warning (without filename for easier GuruChecksDiffs)\n";

# keep the noise before the last test, so we can later trim off
# diagnostics emitted by Test::Builder::_ending
ok(0, "false");
done_testing();
