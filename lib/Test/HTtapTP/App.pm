package Test::HTtapTP::App;
use strict;
use warnings;

use Try::Tiny;
use Plack::Builder;
use Plack::App::Directory;
use Plack::App::CGIBin;

use Cwd 'abs_path';
use File::ShareDir 'module_dir';

sub new {
    my ($pkg) = @_;
    my $self = {};
    bless $self, $pkg;
    return $self;
}

sub devmode {
    my ($self) = @_;
    $self->root; # for side effects
    return $self->{devmode};
}

sub root {
    my ($self) = @_;
    return $self->{root} ||= do {
        my $root = try {
            my $pkg = ref($self);
            module_dir($pkg);
        } catch {
            warn "[d] We're not installed: $_";
            $self->{devmode} = 1;
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
    my $cgi = Plack::App::CGIBin->new(root => "$root/cgi-bin");

    my $app = builder {
        mount '/' => Plack::App::Directory->new({ root => $root });
        mount '/cgi-bin' => $cgi->to_app if $self->devmode;
    };

    return $app;
}

1;
