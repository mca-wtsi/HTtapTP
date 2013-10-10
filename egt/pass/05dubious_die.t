#! perl

use strict;
use warnings;

use Test::HTtapTP;
use Test::More tests => 1;
ok(1, "true");


# What happens below gives this file the name "dubious".
# This is not a recommended way to use Test::More!
#
# Currently the test passes, so we aim to preserve that behaviour
# under Test::HTtapTP.  It may in later days fail, then we have to fix
# the test suite (probably by renaming to fail/06dubious_die_was_pass.t)
die "died after testing complete\n";
END {
    warn "then did reset the exit code\n";
    $? = 0;
};
