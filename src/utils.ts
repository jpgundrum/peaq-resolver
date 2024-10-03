import type { AccountId32, BlockNumber, Moment } from '@polkadot/types/interfaces/runtime';
import { u8aConcat, u8aToU8a } from '@polkadot/util';
import { blake2AsHex, decodeAddress } from '@polkadot/util-crypto';

export enum CreateStorageKeysEnum {
    ADDRESS,
    STANDARD,
  }

export interface CreateStorageKeysArgs {
    value: AccountId32 | string;
    type: CreateStorageKeysEnum;
  }

export const createStorageKeys = (args: CreateStorageKeysArgs[]) => {
    const keysByteArray = [];
  
    for (let i = 0; i < args.length; i++) {
      if (args[i].type === CreateStorageKeysEnum.ADDRESS) {
        const decoded_address = decodeAddress(args[i].value, false, 42);
        keysByteArray.push(decoded_address);
      }
      if (args[i].type === CreateStorageKeysEnum.STANDARD) {
        const hash_name = u8aToU8a(args[i].value);
        keysByteArray.push(hash_name);
      }
    }
  
    const key = u8aConcat(...keysByteArray);
    const hashed_key = blake2AsHex(key, 256);
    return { hashed_key };
  };