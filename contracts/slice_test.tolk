get fixture_addr() {
    return ("EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs"a, "EQDNhy-nxYFgUqzfUzImBEP67JqsyMIcyk2S5_RwNNEYku0k"a);
}

// @scope sum()
// @fuzz _ a: address = Args;
// @runs 100
get test_fuzz_address(a: slice) {
    assert(true) throw 101;
}
// @scope sum()
// @fuzz _ addr: address = Args;
// @runs 100
get test_fuzz_address_with_fixtures(addr: slice) {
    assert(true) throw 101;
}

// @scope sum()
// @fuzz
// @runs 100
get test_fuzz_slice(s: slice) {
    assert(true) throw 101;
}