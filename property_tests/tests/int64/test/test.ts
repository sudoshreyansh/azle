import fc from 'fast-check';

import { runPropTests } from 'azle/property_tests';
import { Int64Arb } from 'azle/property_tests/arbitraries/candid/primitive/ints/int64_arb';
import { CanisterArb } from 'azle/property_tests/arbitraries/canister_arb';
import { QueryMethodArb } from 'azle/property_tests/arbitraries/query_method_arb';

import { generateBody } from './generate_body';
import { generateTests } from './generate_tests';

const AllInt64sQueryMethod = QueryMethodArb(fc.array(Int64Arb), Int64Arb, {
    generateBody,
    generateTests
});

runPropTests(CanisterArb(AllInt64sQueryMethod));