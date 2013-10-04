package Test::HTtapTP::Files;
use strict;
use warnings;

use Plack::App::Directory;
use File::ShareDir 'module_dir';

sub new {
    my ($pkg) = @_;
    my $exp = 'experimental/htdocs'; # XXX: magic special case = bad
    my $root = -d $exp ? $exp : module_dir($pkg);
    my $self = { root => $root };
    bless $self, $pkg;
warn "Reading static files from $root";
    return $self;
}

sub to_app {
    my ($self) = @_;
    my $app = Plack::App::Directory->new({ root => $self->{root} })->to_app;
    return $app;
}

1;
