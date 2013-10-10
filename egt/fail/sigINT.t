#! perl

use strict;
use warnings;

use Test::HTtapTP;
use Test::More tests => 1;
ok(1, "true");

kill 'INT', $$;
