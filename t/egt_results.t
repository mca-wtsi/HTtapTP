#! perl

use strict;
use warnings;

use Test::More;

use Capture::Tiny 0.12 qw( capture ); # need the exit code
use File::Find qw( find );
use YAML qw( Dump );

use Test::Differences; # could be made optional
use Try::Tiny;
use File::Slurp qw( slurp write_file );
use File::Temp qw( tempfile );


my $egt_dir;
my $flavour;
sub main {
    plan tests => 8;

    $egt_dir = __FILE__;
    $egt_dir =~ s{t/egt_results\.t$}{egt}
      or die "Cannot find egt/ from $egt_dir";

    foreach my $F (qw( direct native indirect )) {
        # Run under prove(1) by various routes
        $flavour = $F;
        subtest "passes_$flavour" => \&passes_tt;
        subtest "fails_$flavour"  => \&fails_tt;

        next if $F eq 'indirect'; # only prove(1) is affected by indirect

        # Examine the output with + without extra hackery
        subtest "output_$flavour" => \&output_tt;
    }

    return;
}


# Test that every egt/pass/* test does pass
sub passes_tt {
    my @t = grep { m{^pass} } all_test_files();
    plan tests => 2*@t;

    foreach my $t (@t) {
        my $capt = do_capture_egt(prove => $t);
        my $ok = 1;
        $ok &= is($capt->{exit}, 0, "prove $t: exit code");
        $ok &= like($capt->{out}, qr{^ok }m, "prove pass/ some ok");
        diagcapt($capt) unless $ok;
    }

    return;
}

# Test that every egt/fail/* test does fail
sub fails_tt {
    my @t = grep { not m{^pass} } all_test_files();
    plan tests => 2*@t;

    foreach my $t (@t) {
        my $capt = do_capture_egt(prove => $t);
        my $ok = 1;
        $ok &= isnt($capt->{exit}, 0, "prove $t: exit code");
        $ok &= like($capt->{out}, qr{^ok }m, "prove $t: some ok");
        diagcapt($capt) unless $ok;
    }

    return;
}

sub output_tt {
    my @t = all_test_files();
    plan tests => 1;

    my $want_fn = "$egt_dir/want_$flavour.yaml";
    my $got_fn = "$want_fn~got~last~"; # covered by .gitignore

#    my ($expect) = LoadFile($want_fn);
#
# We check the YAML output text, assuming it is in a(!) canonical
# form.  Could instead check the data structures with is_deeply.

    my %out = (Flavour => $flavour,
               map {( $_ => do_capture_egt(perl => $_) )} @t);

    my $got = Dump(\%out);
    my $want = slurp($want_fn);

    my $ok = eq_or_diff($got, $want, "test output, $flavour flavour");
    if (!$ok) {
        try {
            write_file($got_fn, { atomic => 1 }, $got);
            warn "Write diagnostic to $got_fn";
        } catch {
            warn "Failed writing diagnostic $got_fn: $!";
        };
    } else {
        unlink $got_fn; # may be absent, or could fail
    }

    return;
}


sub all_test_files {
    my @t;
    find({ no_chdir => 1,
           wanted => sub { push @t, $_ if -f && m{\.t$} },
         }, $egt_dir);
    foreach (@t) { s{^\Q$egt_dir\E/}{} }
    return @t;
}

sub do_capture_egt {
    my ($tool, $t) = @_;

    local $ENV{TEST_HTTAPTP_INHIBIT} = ($flavour eq 'native');

    my @cmd;
    if ($tool eq 'perl' || $flavour eq 'indirect') {
        @cmd = ($^X);
    } elsif ($tool eq 'prove') {
        @cmd = qw( prove -rv );
    } else {
        die "Unknown tool=$tool";
    }

    my ($out, $err, $exit) = capture {
        system(@cmd, "$egt_dir/$t");
    };

    if ($flavour eq 'indirect' && $tool eq 'prove') {
        # Emulate the passing of STDOUT across HTTP.
        #
        # $exit and $err are lost, possibly leaving trace in the
        # webserver logs.
        my $tap = $out;

        my ($fh, $filename) = tempfile('egt_indirect.XXXXXX',
                                       TMPDIR => 1, UNLINK => 0);
        print {$fh} $tap or die "Writing TAP to $filename: $!";
        close $fh;

        @cmd = qw( prove -v -e cat );
        ($out, $err, $exit) = capture {
            # XXX:UNIX assuming we have cat(1)
            system(@cmd, $filename);
        };
    }

    return { tool => $tool, test => $t,
             out => $out, err => $err, exit => $exit };
}

sub diagcapt {
    my ($capt) = @_;
    diag "STDOUT was\n$capt->{out}\n\nSTDERR was\n$capt->{err}\n";
    return;
}


main();
