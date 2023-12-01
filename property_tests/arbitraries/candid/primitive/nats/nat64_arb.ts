import fc from 'fast-check';
import { CandidMetaArb } from '../../candid_arb';
import { bigintToSrcLiteral } from '../../to_src_literal/bigint';

export const Nat64Arb = CandidMetaArb(
    fc.bigUintN(64),
    'nat64',
    bigintToSrcLiteral
);