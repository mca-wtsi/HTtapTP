#! perl

use strict;
use warnings;

use Test::HTtapTP;
use Test::More;

plan tests => 2;

subtest foo => sub {
    ok(1, 'one');
    ok(2, 'two');
    done_testing();
    return;
};

subtest bar => sub {
    plan tests => 2;
    ok(3, 'three');
    ok(4, 'four');
    return;
};
