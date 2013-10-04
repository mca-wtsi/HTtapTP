package Test::HTtapTP::App;
use strict;
use warnings;

use Try::Tiny;
use Plack::Builder;
use Plack::App::Directory;
use Cwd 'abs_path';
use File::ShareDir 'module_dir';

sub new {
    my ($pkg) = @_;
    my $self = {};
    bless $self, $pkg;
    return $self;
}

sub root {
    my ($self) = @_;
    return $self->{root} ||= do {
        my $root = try {
            my $pkg = ref($self);
            module_dir($pkg);
        } catch {
            warn "[d] We're not installed: $_";
            my $fn = abs_path(__FILE__);
            $fn =~ s{lib/Test/HTtapTP/App\.pm$}{htdocs-devmode}
              or die "Can't make root from $fn";
            warn "[d] Using root=$fn\n";
            $fn;
        };
        $root =~ s{/*$}{};
        $root;
    };
}

sub to_app {
    my ($self) = @_;

    my $root = $self->root;
    my $app = builder {
        mount '/' => Plack::App::Directory->new({ root => $root });
    };

    return $app;
}

1;
