import { deepEqual } from 'fast-equals';

import { getActor, Named } from 'azle/property_tests';
import { CandidMeta } from 'azle/property_tests/arbitraries/candid/candid_arb';
import {
    Tuple,
    ReturnTuple
} from 'azle/property_tests/arbitraries/candid/constructed/tuple_arb';
import { Test } from 'azle/test';

export function generateTests(
    functionName: string,
    namedParamTuples: Named<CandidMeta<Tuple, ReturnTuple>>[],
    returnTuple: CandidMeta<Tuple, ReturnTuple>
): Test[] {
    const expectedResult = returnTuple.agentResponseValue;

    return [
        {
            name: `tuple ${functionName}`,
            test: async () => {
                const actor = getActor('./tests/tuple/test');

                const result = await actor[functionName](
                    ...namedParamTuples.map(
                        (param) => param.el.agentArgumentValue
                    )
                );

                return { Ok: deepEqual(result, expectedResult) };
            }
        }
    ];
}