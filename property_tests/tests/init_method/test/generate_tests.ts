import { deepEqual, Named, getActor } from 'azle/property_tests';
import { CandidValueAndMeta } from 'azle/property_tests/arbitraries/candid/candid_value_and_meta_arb';
import { CorrespondingJSType } from 'azle/property_tests/arbitraries/candid/corresponding_js_type';
import { Test } from 'azle/test';

export function generateTests(
    _functionName: string,
    params: Named<CandidValueAndMeta<CorrespondingJSType>>[]
): Test[][] {
    const expectedResult = [
        true,
        ...params.map((param) => param.el.value.agentResponseValue)
    ];

    return [
        [
            {
                name: `init method`,
                test: async () => {
                    const actor = getActor('./tests/init_method/test');
                    const result = await actor.getInitValues();

                    const valuesAreEqual = deepEqual(result, expectedResult);

                    return valuesAreEqual
                        ? { Ok: true }
                        : {
                              Err: `\n Incorrect return value\n   expected: ${expectedResult}\n   received: ${result}`
                          };
                }
            }
        ]
    ];
}
