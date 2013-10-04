package Test::HTtapTP::App;
use strict;
use warnings;

use Plack::Builder;
use Test::HTtapTP::Files;

sub new {
    my ($pkg) = @_;
    my $self = {};
    bless $self, $pkg;
    return $self;
}

sub to_app {
    my ($self) = @_;

    my $app = builder {
        mount '/' => Test::HTtapTP::Files->new->to_app,
    };

    return $app;
}

1;
