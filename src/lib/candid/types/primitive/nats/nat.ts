import { IDL } from '@dfinity/candid';
import { encode } from '../../../serde/encode';
import { decode } from '../../../serde/decode';

export class AzleNat {
    _azleKind: 'AzleNat' = 'AzleNat';
    _azleCandidType?: '_azleCandidType';

    static _azleKind: 'AzleNat' = 'AzleNat';
    static _azleCandidType?: '_azleCandidType';

    static toBytes(data: any) {
        return encode(this, data);
    }

    static fromBytes(bytes: Uint8Array) {
        return decode(this, bytes);
    }

    static getIdl() {
        return IDL.Nat;
    }
}

export const nat = AzleNat;
export type nat = bigint;
