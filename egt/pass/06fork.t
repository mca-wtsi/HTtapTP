#! perl

use strict;
use warnings;

use Test::HTtapTP;
use Test::More;

plan tests => 2;
ok(1, "true");

my $pid = open my $fh, '-|';
if (!defined $pid) {
    fail("fork failed: $!");
} elsif ($pid) {
    # parent
    my $txt = do { local $/; <$fh> };
    is($txt, "some text\nfrom child pid $pid\n", 'got text from child');
} else {
    # child
    print "some text\nfrom child pid $$\n";
    # Fall off the end.
    #
    # END blocks will happen, but should do nothing.
}
