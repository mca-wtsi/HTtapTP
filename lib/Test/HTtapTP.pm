package Test::HTtapTP;
use strict;
use warnings;

use Test::HTtapTP::Builder;
require Test::Builder;

sub __init {
    my $Test = Test::Builder->new; # the singleton

    # Do this to ensure that { plan tests => 1; ok(1, "cool"); die }
    # will show an explicit failure
    Test::HTtapTP::Builder->rebless_singleton($Test);

    $Test->init_for_web if $ENV{GATEWAY_INTERFACE};

    return;
}


__init();


1;
