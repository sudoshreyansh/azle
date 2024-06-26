import fc from 'fast-check';

import {
    CandidValueAndMeta,
    CandidValueAndMetaArb
} from './candid_value_and_meta_arb';
import { CorrespondingJSType } from './corresponding_js_type';
import { VoidArb } from './primitive/void';

export type CandidReturnType = CorrespondingJSType | undefined;

export function CandidReturnTypeArb(): fc.Arbitrary<
    CandidValueAndMeta<CandidReturnType>
> {
    return fc.oneof(
        { arbitrary: CandidValueAndMetaArb(), weight: 17 },
        { arbitrary: VoidArb(), weight: 1 }
    );
}
