import fc from 'fast-check';

import { runPropTests } from 'azle/property_tests';
import {
    CandidValueAndMeta,
    CandidValueAndMetaArb
} from 'azle/property_tests/arbitraries/candid/candid_value_and_meta_arb';
import { CandidReturnTypeArb } from 'azle/property_tests/arbitraries/candid/candid_return_type_arb';
import {
    CanisterArb,
    CanisterConfig
} from 'azle/property_tests/arbitraries/canister_arb';
import { UpdateMethodArb } from 'azle/property_tests/arbitraries/canister_methods/update_method_arb';
import {
    QueryMethod,
    QueryMethodArb
} from 'azle/property_tests/arbitraries/canister_methods/query_method_arb';
import { PostUpgradeMethodArb } from 'azle/property_tests/arbitraries/canister_methods/post_upgrade_arb';

import { generateBody as callableMethodBodyGenerator } from './generate_callable_method_body';
import { generateBody as postUpgradeMethodBodyGenerator } from './generate_post_deploy_method_body';
import { generateBody as postInitMethodBodyGenerator } from './generate_init_method_body';
import { generateTests as generateInitTests } from './generate_init_tests';
import { generateTests as generatePostUpgradeTests } from './generate_post_upgrade_tests';
import { CorrespondingJSType } from '../../../arbitraries/candid/corresponding_js_type';
import { InitMethodArb } from 'azle/property_tests/arbitraries/canister_methods/init_method_arb';
import { globalInitVarName, globalPostUpgradeVarName } from './global_var_name';
import { candidDefinitionArb } from '../../../arbitraries/candid/candid_definition_arb';
import { CandidValueArb } from '../../../arbitraries/candid/candid_values_arb';
import { definitionAndValueToValueAndMeta } from '../../../arbitraries/candid/candid_value_and_meta_arb_generator';
import {
    CandidDefinition,
    WithShapes
} from '../../../arbitraries/candid/candid_definition_arb/types';
import { DEFAULT_VALUE_MAX_DEPTH } from '../../../arbitraries/config';

const CanisterConfigArb = fc
    .array(candidDefinitionArb({}))
    .chain((paramDefinitionsWithShapes) => {
        const initParamValues = definitionsToValueAndMetaArb(
            paramDefinitionsWithShapes
        );
        const postParamValues = definitionsToValueAndMetaArb(
            paramDefinitionsWithShapes
        );
        return fc.tuple(initParamValues, postParamValues);
    })
    .chain(([initDeployParams, postUpgradeParams]) => {
        const initDeployParamsArb = fc.constant(initDeployParams);
        const postUpgradeParamsArb = fc.constant(postUpgradeParams);

        const SimpleInitMethodArb = InitMethodArb(initDeployParamsArb, {
            generateBody: postInitMethodBodyGenerator,
            generateTests: generateInitTests
        });

        const SimplePostUpgradeMethodArb = PostUpgradeMethodArb(
            postUpgradeParamsArb,
            {
                generateBody: postUpgradeMethodBodyGenerator,
                generateTests: generatePostUpgradeTests
            }
        );

        const HeterogeneousQueryMethodArb = QueryMethodArb(
            fc.array(CandidValueAndMetaArb()),
            CandidReturnTypeArb(),
            {
                generateBody: callableMethodBodyGenerator,
                generateTests: () => []
            }
        );

        const HeterogeneousUpdateMethodArb = UpdateMethodArb(
            fc.array(CandidValueAndMetaArb()),
            CandidReturnTypeArb(),
            {
                generateBody: callableMethodBodyGenerator,
                generateTests: () => []
            }
        );

        const small = {
            minLength: 0,
            maxLength: 20
        };

        return fc.tuple(
            initDeployParamsArb,
            postUpgradeParamsArb,
            SimpleInitMethodArb,
            SimplePostUpgradeMethodArb,
            fc.array(HeterogeneousQueryMethodArb, small),
            fc.array(HeterogeneousUpdateMethodArb, small)
        );
    })
    .map(
        ([
            initParams,
            postUpgradeParams,
            initMethod,
            postUpgradeMethod,
            queryMethods,
            updateMethods
        ]): CanisterConfig<CorrespondingJSType, CorrespondingJSType> => {
            const paramCandidTypeObjects = postUpgradeParams.map(
                // The candidTypeObjects ought to be the same so it doesn't mater which we use to generate this list
                (param) => param.src.candidTypeObject
            );

            const globalInitVariableNames = initParams.map((_, i) =>
                globalInitVarName(i)
            );
            const globalPostUpgradeVariableNames = postUpgradeParams.map(
                (_, i) => globalPostUpgradeVarName(i)
            );
            const globalInitVariableDeclarations = initParams.map(
                (param, i) =>
                    `let ${globalInitVarName(i)}: ${
                        param.src.candidTypeAnnotation
                    };`
            );
            const globalPostUpgradeVariableDeclarations = postUpgradeParams.map(
                (param, i) =>
                    `let ${globalPostUpgradeVarName(i)}: ${
                        param.src.candidTypeAnnotation
                    };`
            );

            const globalDeclarations = [
                'let postUpgradeHookExecuted: boolean = false;',
                'let initHookExecuted: boolean = false;',
                ...globalInitVariableDeclarations,
                ...globalPostUpgradeVariableDeclarations
            ];

            const getPostUpgradeValues =
                generateGetPostUpgradeValuesCanisterMethod(
                    paramCandidTypeObjects,
                    globalPostUpgradeVariableNames
                );

            const getInitValues = generateGetInitValuesCanisterMethod(
                paramCandidTypeObjects,
                globalInitVariableNames
            );

            const isPostUpgradeCalled = generateIsPostUpgradeCalled(
                globalPostUpgradeVariableNames
            );

            const isInitCalled = generateIsInitCalled(globalInitVariableNames);

            const getInitHookExecuted = generateGetInitHookExecuted();

            const getPostUpgradeHookExecuted =
                generateGetPostUpgradeHookExecuted();

            return {
                globalDeclarations,
                initMethod,
                postUpgradeMethod,
                queryMethods: [
                    getInitValues,
                    getPostUpgradeValues,
                    isPostUpgradeCalled,
                    isInitCalled,
                    getInitHookExecuted,
                    getPostUpgradeHookExecuted,
                    ...queryMethods
                ],
                updateMethods
            };
        }
    );

function generateGetPostUpgradeValuesCanisterMethod(
    postUpgradeParamCandidTypeObjects: string[],
    globalPostUpgradeVariableNames: string[]
): QueryMethod {
    return {
        imports: new Set(['Tuple', 'bool', 'query']),
        globalDeclarations: [],
        sourceCode: /*TS*/ `getPostUpgradeValues: query(
            [],
            Tuple(bool, ${postUpgradeParamCandidTypeObjects.join()}),
            () => {return [postUpgradeHookExecuted, ${globalPostUpgradeVariableNames.join()}]}
        )`,
        tests: []
    };
}

function generateGetInitValuesCanisterMethod(
    postUpgradeParamCandidTypeObjects: string[],
    globalPostUpgradeVariableNames: string[]
): QueryMethod {
    return {
        imports: new Set(['Tuple', 'bool', 'query']),
        globalDeclarations: [],
        sourceCode: /*TS*/ `getInitValues: query(
            [],
            Tuple(bool, ${postUpgradeParamCandidTypeObjects.join()}),
            () => {return [initHookExecuted, ${globalPostUpgradeVariableNames.join()}]}
        )`,
        tests: []
    };
}

function generateGetInitHookExecuted(): QueryMethod {
    return {
        imports: new Set(['bool', 'query']),
        globalDeclarations: [],
        sourceCode: /*TS*/ `getInitHookExecuted: query([], bool, () => initHookExecuted)`,
        tests: []
    };
}

function generateIsInitCalled(
    globalPostUpgradeVariableNames: string[]
): QueryMethod {
    return {
        imports: new Set(['bool', 'query']),
        globalDeclarations: [],
        sourceCode: /*TS*/ `isInitCalled: query([], bool, () => ${globalPostUpgradeVariableNames
            .map((name) => `${name} === undefined`)
            .join(' && ')})`,
        tests: []
    };
}

function generateIsPostUpgradeCalled(
    globalPostUpgradeVariableNames: string[]
): QueryMethod {
    return {
        imports: new Set(['bool', 'query']),
        globalDeclarations: [],
        sourceCode: /*TS*/ `isPostUpgradeCalled: query([], bool, () => ${globalPostUpgradeVariableNames
            .map((name) => `${name} === undefined`)
            .join(' && ')})`,
        tests: []
    };
}

function generateGetPostUpgradeHookExecuted(): QueryMethod {
    return {
        imports: new Set(['bool', 'query']),
        globalDeclarations: [],
        sourceCode: /*TS*/ `getPostUpgradeHookExecuted: query([], bool, () => postUpgradeHookExecuted)`,
        tests: []
    };
}

function definitionsToValueAndMetaArb(
    definitionsWithShapes: WithShapes<CandidDefinition>[]
): fc.Arbitrary<CandidValueAndMeta<CorrespondingJSType>[]> {
    const definitions = definitionsWithShapes.map(
        (definitionWithShapes) => definitionWithShapes.definition
    );
    const recursiveShapes = definitionsWithShapes.reduce(
        (acc, definitionsWithShapes) => {
            return { ...acc, ...definitionsWithShapes.recursiveShapes };
        },
        {}
    );
    return fc
        .tuple(
            fc.constant(definitions),
            fc.tuple(
                ...definitions.map((definition) =>
                    CandidValueArb(
                        definition,
                        recursiveShapes,
                        DEFAULT_VALUE_MAX_DEPTH
                    )
                )
            )
        )
        .map(
            ([
                definitions,
                values
            ]): CandidValueAndMeta<CorrespondingJSType>[] => {
                return values.map((value, index) => {
                    return definitionAndValueToValueAndMeta(
                        definitions[index],
                        value
                    );
                });
            }
        );
}

runPropTests(CanisterArb(CanisterConfigArb));
