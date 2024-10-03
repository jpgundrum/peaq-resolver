import { ApiPromise, WsProvider } from '@polkadot/api';
import { u8aConcat, u8aToU8a } from '@polkadot/util';
import { cryptoWaitReady, blake2AsHex, decodeAddress } from '@polkadot/util-crypto';
import { defaultOptions } from '@peaq-network/types';
import type { Bytes, Struct } from '@polkadot/types-codec';
import type { AccountId32, BlockNumber, Moment } from '@polkadot/types/interfaces/runtime';

import peaqDidProto from 'peaq-did-proto-js';


export enum CreateStorageKeysEnum {
  ADDRESS,
  STANDARD,
}

export interface CreateStorageKeysArgs {
  value: AccountId32 | string;
  type: CreateStorageKeysEnum;
}

type Address = AccountId32 | string;

interface Attribute extends Struct {
  readonly name: Bytes;
  readonly value: Bytes;
  readonly validity: BlockNumber;
  readonly created: Moment;
}

interface RequestDidOptions {
  baseUrl: string;
  name: string;
  address: string;
}

interface ReadDidOptions {
  baseUrl: string;
  name: string;
  address: string;
}

interface ReadRequestResponse {
  value: any;
  document: any;
}

interface ReadDidResponse {
  value: any;
  document: any;
}

class ReadDidError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReadDidError";
  }
}

/**
 * Lightweight package used for easy DID Resolution.
 */
export class peaqDidResolver {
  constructor() {
  }

  /**
   * Generic request builder that return the full DID Document from chain. 
   * Reads the DID based on the baseUrl, DID name, and the address of the wallet 
   * that has ownership.
   * @param options - The options for reading the entire DID.
   * @returns A promise that resolves to the full DID Document as on chain
   */
  private async request(options: RequestDidOptions): Promise<ReadRequestResponse | null>{
    try {
      const { baseUrl, name, address } = options;
      if (!baseUrl) throw new Error('Node baseUrl is required when resolving a DID.');
      if (!name) throw new Error('Name is required when resolving a DID.');
      if (!address) throw new Error('Address is required when resolving a DID.');
      if (address !== '') this._checkAddress(address);

      await cryptoWaitReady();
      const provider = new WsProvider(baseUrl);
      const api = await ApiPromise.create({
        provider,
        noInitWarn: true,
        ...defaultOptions,
      });


      const accountAddress = address;
      if (!accountAddress) throw new Error('Address is required');

      const { hashed_key } = this._createStorageKeys([
        {
          value: accountAddress,
          type: CreateStorageKeysEnum.ADDRESS,
        },
        { value: name, type: CreateStorageKeysEnum.STANDARD },
      ]);


      const did = (await api.query?.['peaqDid']?.['attributeStore'](
        hashed_key
      )) as unknown as Attribute;

      if (!did || did.isStorageFallback) return null;

      const document = peaqDidProto.Document.deserializeBinary(did?.value);

      await api.disconnect();
      await provider.disconnect();

      return {
        ...did.toHuman(),
        document: document.toObject(),
      } as ReadDidResponse;
    } catch (error) {
      throw new ReadDidError(`${error}`);
    }
  }

  /**
   * Resolves the entire DID as written on chain.
   * @param options - The options for reading the DID attribute.
   * @returns A promise that resolves with the DID attribute.
   */
  public async resolve(options: ReadDidOptions): Promise<ReadDidResponse | null> {
    try {
      return(await this.request(options));

    } catch (error) {
      throw new ReadDidError(`${error}`);
    }
  }

  /**
   * Reads the document of the DID on chain.
   * @param options - The options for reading the entire DID.
   * @returns The document of the DID.
   */
  public async resolve_document(options: ReadDidOptions): Promise<ReadDidResponse | null> {
    try {
      const resp = await this.request(options);
      return resp?.document;

    } catch (error) {
      throw new ReadDidError(`${error}`);
    }
  }

  /**
   * Reads the services field of the DID on chain.
   * @param options - The options for reading the entire DID.
   * @returns The services as defined in the DID document.
   */
  public async resolve_services(options: ReadDidOptions): Promise<ReadDidResponse | null> {
    try {
      const resp = await this.request(options);
      return resp?.document?.services;

    } catch (error) {
      throw new ReadDidError(`${error}`);
    }
  }

  /**
   * Reads the verifications field of the DID on chain.
   * @param options - The options for reading the entire DID.
   * @returns The verifications as defined in the DID document.
   */
  public async resolve_verifications(options: ReadDidOptions): Promise<ReadDidResponse | null> {
    try {
      const resp = await this.request(options);
      return resp?.document?.verificationMethods;

    } catch (error) {
      throw new ReadDidError(`${error}`);
    }
  }

  /**
   * Reads the authentications field of the DID on chain.
   * @param options - The options for reading the entire DID.
   * @returns The authentications as defined in the DID document.
   */
  public async resolve_authentications(options: ReadDidOptions): Promise<ReadDidResponse | null> {
    try {
      const resp = await this.request(options);
      return resp?.document?.authentications;

    } catch (error) {
      throw new ReadDidError(`${error}`);
    }
  }

  /**
   * Reads the signature field of the DID on chain.
   * @param options - The options for reading the entire DID.
   * @returns The signature as defined in the DID document.
   */
  public async resolve_signature(options: ReadDidOptions): Promise<ReadDidResponse | null> {
    try {
      const resp = await this.request(options);
      return resp?.document?.signature;

    } catch (error) {
      throw new ReadDidError(`${error}`);
    }
  }

  /**
   * Checks the passed address for proper format. Throws error if does not match expected.
   * @param accountAddress - Address to check
   * @returns None
   */
  private _checkAddress(accountAddress: Address) {
    if (!accountAddress) throw new Error('Address is required');
    const regexSS58 = /^[1-9A-HJ-NP-Za-km-z]{48}$/; // regex for ss58
    const regexETH = /^0x[a-fA-F0-9]{40}$/;         // regex for Ethereum
    if(!regexSS58.test(accountAddress as string) && !regexETH.test(accountAddress as string)){
      throw new Error(`Incorrect Substrate SS58/Ethereum Address format. Given address does not match expected length or contains an invalid char. 
        SS58 address are 58 char in length with 0, O, I & l omitted. Ethereum addresses are 42 characters in length, starting with "0x" followed by 
        40 hexadecimal characters (0-9, a-f, A-F) with no characters omitted.`);
    }
  }

  /**
   * Generates storage keys for the user based on the address and type of 
   * data being searched
   * @param accountAddress - Address to check
   * @returns None
   */
  private _createStorageKeys (args: CreateStorageKeysArgs[]) {
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
}