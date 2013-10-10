#! perl

use strict;
use warnings;

use Test::HTtapTP;
use Test::More tests => 1;
ok(1, "true");

die "died after testing complete\n";
END {
    warn "then did reset the exit code, but non-zero\n";
    $? = 28;
};
