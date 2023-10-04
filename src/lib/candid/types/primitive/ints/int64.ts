import { IDL } from '@dfinity/candid';

export class AzleInt64 {
    _kind: 'AzleInt64' = 'AzleInt64';
    _azleCandidType?: '_azleCandidType';

    static getIDL() {
        return IDL.Int64;
    }
}
export const int64: AzleInt64 = AzleInt64 as any;
export type int64 = bigint;