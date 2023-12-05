import fc from 'fast-check';

import { runPropTests } from 'azle/property_tests';
import { Nat32Arb } from 'azle/property_tests/arbitraries/candid/primitive/nats/nat32_arb';
import { CanisterArb } from 'azle/property_tests/arbitraries/canister_arb';
import { QueryMethodArb } from 'azle/property_tests/arbitraries/canister_methods/query_method_arb';

import { generateBody } from './generate_body';
import { generateTests } from './generate_tests';

const AllNat32sQueryMethodArb = QueryMethodArb(
    fc.array(Nat32Arb()),
    Nat32Arb(),
    {
        generateBody,
        generateTests
    }
);

runPropTests(
    CanisterArb({
        queryMethods: fc.array(AllNat32sQueryMethodArb, {
            minLength: 20,
            maxLength: 100
        })
    })
);
