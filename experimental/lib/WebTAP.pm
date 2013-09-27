package WebTAP; # a working title
use strict;
use warnings;

require Test::Builder;

sub __init {
    my $Test = Test::Builder->new; # the singleton

    # Do this to ensure that { plan tests => 1; ok(1, "cool"); die }
    # will show an explicit failure
    WebTAP::Builder->rebless_singleton($Test);

    $Test->init_for_web if $ENV{GATEWAY_INTERFACE};

    return;
}


__init();


package WebTAP::Builder;
our @ISA;

# This is horrible.  Monkey-patching Test::Builder::is_passing is an
# alternative which seemed worse.
sub rebless_singleton {
    my ($pkg, $obj) = @_;
    @ISA = (ref($obj)); # subclass of...  whatever we were given
    bless $obj, $pkg; # rebless
    return $obj;
}


sub is_passing {
    my $self = shift;
    if (@_ && !$_[0]) {
        # caller is clearing the is_passing flag
        my $fail_count = grep { !$_ } $self->summary;
        $self->make_failure_explicit unless $fail_count;
    }
    return $self->SUPER::is_passing(@_);
}

sub make_failure_explicit {
    my ($self) = @_;
    # ensure something in the output stream shows that we are not passing
    my $k = __PACKAGE__.'/is_passing';
    if ($self->{$k}) {
        warn "recursion dodged";
    } else {
        local $self->{$k} = 1;
        my $cls = ref($self);
        $self->ok(0, "fail marker on STDOUT from $cls, to show is_passing being cleared");
    }
}


sub init_for_web {
    my ($self) = @_;

    print "Content-type: text/plain\n\n";
    $self->failure_output(\*STDOUT);

    $SIG{__WARN__} = sub { $self->_warn(w => @_); warn @_ };
    $SIG{__DIE__} = sub { $self->_warn(e => @_); die @_ };

    return;
}

sub _warn {
    my ($self, $letter, $msg) = @_;
    $msg =~ s{\n\z}{};
    $msg =~ s{\n}{\n  | }g;
    $self->diag("[$letter] $msg");
    return;
}


1;
