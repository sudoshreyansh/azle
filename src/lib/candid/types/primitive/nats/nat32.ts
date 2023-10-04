import { IDL } from '@dfinity/candid';

export class AzleNat32 {
    _kind: 'AzleNat32' = 'AzleNat32';
    _azleCandidType?: '_azleCandidType';

    static getIDL() {
        return IDL.Nat32;
    }
}
export const nat32: AzleNat32 = AzleNat32 as any;
export type nat32 = number;
