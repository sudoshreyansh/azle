// Copyright 2021 DFINITY Stiftung

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at

//    http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

// The original license for the DFINITY code can be found here: https://github.com/dfinity/ic/blob/master/LICENSE
// This file contains derivative works licensed as MIT: https://github.com/demergent-labs/azle/blob/main/LICENSE

// Taken in part from: https://github.com/dfinity/interface-spec/blob/master/spec/ic.did

import {
    Alias,
    blob,
    CallResult,
    Func,
    nat,
    nat64,
    Opt,
    Principal,
    Query,
    Record,
    Service,
    serviceUpdate,
    Variant,
    Vec
} from '../../index';

import {
    GetBalanceArgs,
    GetCurrentFeePercentilesArgs,
    GetUtxosArgs,
    GetUtxosResult,
    MillisatoshiPerByte,
    Satoshi,
    SendTransactionArgs
} from './bitcoin';

export {
    BitcoinAddress,
    BitcoinNetwork,
    BlockHash,
    GetBalanceArgs,
    GetCurrentFeePercentilesArgs,
    GetUtxosArgs,
    GetUtxosResult,
    MillisatoshiPerByte,
    Outpoint,
    Page,
    Satoshi,
    SendTransactionArgs,
    SendTransactionError,
    Utxo,
    UtxosFilter
} from './bitcoin';

export type CanisterId = Alias<Principal>;
export type UserId = Alias<Principal>;
export type WasmModule = Alias<blob>;

export type CanisterSettings = Record<{
    controllers: Opt<Vec<Principal>>;
    compute_allocation: Opt<nat>;
    memory_allocation: Opt<nat>;
    freezing_threshold: Opt<nat>;
}>;

export type DefiniteCanisterSettings = Record<{
    controllers: Vec<Principal>;
    compute_allocation: nat;
    memory_allocation: nat;
    freezing_threshold: nat;
}>;

export type CreateCanisterArgs = Record<{
    settings: Opt<CanisterSettings>;
}>;

export type CreateCanisterResult = Record<{
    canister_id: CanisterId;
}>;

export type UpdateSettingsArgs = Record<{
    canister_id: Principal;
    settings: CanisterSettings;
}>;

export type InstallCodeArgs = Record<{
    mode: InstallCodeMode;
    canister_id: CanisterId;
    wasm_module: WasmModule;
    arg: blob;
}>;

export type InstallCodeMode = Variant<{
    install: null;
    reinstall: null;
    upgrade: null;
}>;

export type UninstallCodeArgs = Record<{
    canister_id: CanisterId;
}>;

export type StartCanisterArgs = Record<{
    canister_id: CanisterId;
}>;

export type StopCanisterArgs = Record<{
    canister_id: CanisterId;
}>;

export type CanisterStatusArgs = Record<{
    canister_id: Principal;
}>;

export type CanisterStatusResult = Record<{
    status: CanisterStatus;
    settings: DefiniteCanisterSettings;
    module_hash: Opt<blob>;
    memory_size: nat;
    cycles: nat;
}>;

export type CanisterStatus = Variant<{
    running: null;
    stopping: null;
    stopped: null;
}>;

export type DeleteCanisterArgs = Record<{
    canister_id: CanisterId;
}>;

export type DepositCyclesArgs = Record<{
    canister_id: CanisterId;
}>;

export type ProvisionalCreateCanisterWithCyclesArgs = Record<{
    amount: Opt<nat>;
    settings: Opt<CanisterSettings>;
}>;

export type ProvisionalCreateCanisterWithCyclesResult = Record<{
    canister_id: CanisterId;
}>;

export type ProvisionalTopUpCanisterArgs = Record<{
    canister_id: CanisterId;
    amount: nat;
}>;

export type HttpRequestArgs = Record<{
    url: string;
    max_response_bytes: Opt<nat64>;
    method: HttpMethod;
    headers: Vec<HttpHeader>;
    body: Opt<blob>;
    transform: Opt<HttpTransform>;
}>;

export type HttpTransform = Record<{
    function: HttpTransformFunc;
    context: blob;
}>;

export type HttpTransformFunc = Func<
    Query<(args: HttpTransformArgs) => HttpResponse>
>;

export type HttpTransformArgs = Record<{
    response: HttpResponse;
    context: blob;
}>;

export type HttpMethod = Variant<{
    get: null;
    head: null;
    post: null;
}>;

export type HttpHeader = Record<{
    name: string;
    value: string;
}>;

export type HttpResponse = Record<{
    status: nat;
    headers: Vec<HttpHeader>;
    body: blob;
}>;

export type KeyId = Record<{
    curve: EcdsaCurve;
    name: string;
}>;

export type EcdsaCurve = Variant<{
    secp256k1: null;
}>;

export type EcdsaPublicKeyArgs = Record<{
    canister_id: Opt<Principal>;
    derivation_path: Vec<blob>;
    key_id: KeyId;
}>;

export type SignWithEcdsaArgs = Record<{
    message_hash: blob;
    derivation_path: Vec<blob>;
    key_id: KeyId;
}>;

export type EcdsaPublicKeyResult = Record<{
    public_key: blob;
    chain_code: blob;
}>;

export type SignWithEcdsaResult = Record<{
    signature: blob;
}>;

export class Management extends Service {
    @serviceUpdate
    bitcoin_get_balance: (args: GetBalanceArgs) => CallResult<Satoshi>;

    @serviceUpdate
    bitcoin_get_current_fee_percentiles: (
        args: GetCurrentFeePercentilesArgs
    ) => CallResult<Vec<MillisatoshiPerByte>>;

    @serviceUpdate
    bitcoin_get_utxos: (args: GetUtxosArgs) => CallResult<GetUtxosResult>;

    @serviceUpdate
    bitcoin_send_transaction: (args: SendTransactionArgs) => CallResult<void>;

    @serviceUpdate
    create_canister: (
        args: CreateCanisterArgs
    ) => CallResult<CreateCanisterResult>;

    @serviceUpdate
    update_settings: (args: UpdateSettingsArgs) => CallResult<void>;

    @serviceUpdate
    install_code: (args: InstallCodeArgs) => CallResult<void>;

    @serviceUpdate
    uninstall_code: (args: UninstallCodeArgs) => CallResult<void>;

    @serviceUpdate
    start_canister: (args: StartCanisterArgs) => CallResult<void>;

    @serviceUpdate
    stop_canister: (args: StopCanisterArgs) => CallResult<void>;

    @serviceUpdate
    canister_status: (
        args: CanisterStatusArgs
    ) => CallResult<CanisterStatusResult>;

    @serviceUpdate
    delete_canister: (args: DeleteCanisterArgs) => CallResult<void>;

    @serviceUpdate
    deposit_cycles: (args: DepositCyclesArgs) => CallResult<void>;

    @serviceUpdate
    raw_rand: () => CallResult<blob>;

    @serviceUpdate
    http_request: (args: HttpRequestArgs) => CallResult<HttpResponse>;

    @serviceUpdate
    provisional_create_canister_with_cycles: (
        args: ProvisionalCreateCanisterWithCyclesArgs
    ) => CallResult<ProvisionalCreateCanisterWithCyclesResult>;

    @serviceUpdate
    provisional_top_up_canister: (
        args: ProvisionalTopUpCanisterArgs
    ) => CallResult<void>;

    @serviceUpdate
    ecdsa_public_key: (
        args: EcdsaPublicKeyArgs
    ) => CallResult<EcdsaPublicKeyResult>;

    @serviceUpdate
    sign_with_ecdsa: (
        args: SignWithEcdsaArgs
    ) => CallResult<SignWithEcdsaResult>;
}

export const managementCanister = new Management(
    Principal.fromText('aaaaa-aa')
);
