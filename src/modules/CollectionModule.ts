/**
 * Collection Module for NFT collection management
 */

import { BaseModule } from './BaseModule';
import type {
  CreateERC721CollectionParams,
  CreateERC1155CollectionParams,
  MintERC721Params,
  MintERC1155Params,
  TokenStandard,
} from '../types/contracts';
import type { TransactionReceipt } from '../types/entities';
import { validateAddress, ErrorCodes } from '../utils/errors';

/**
 * CollectionModule handles NFT collection creation and minting
 */
export class CollectionModule extends BaseModule {
  /**
   * Create a new ERC721 collection
   */
  async createERC721Collection(
    params: CreateERC721CollectionParams
  ): Promise<{ address: string; tx: TransactionReceipt }> {
    const { name, symbol, baseUri, maxSupply, options } = params;

    const txManager = this.ensureTxManager();
    const provider = this.ensureProvider();

    // Get factory contract
    const factoryContract = await this.contractRegistry.getContract(
      'ERC721CollectionFactory',
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    // Create collection
    const receipt = await txManager.sendTransaction(
      factoryContract,
      'createCollection',
      [name, symbol, baseUri, maxSupply],
      options
    );

    // Extract collection address from event logs
    const address = await this.extractCollectionAddress(receipt);

    return { address, tx: receipt };
  }

  /**
   * Create a new ERC1155 collection
   */
  async createERC1155Collection(
    params: CreateERC1155CollectionParams
  ): Promise<{ address: string; tx: TransactionReceipt }> {
    const { uri, options } = params;

    const txManager = this.ensureTxManager();
    const provider = this.ensureProvider();

    // Get factory contract
    const factoryContract = await this.contractRegistry.getContract(
      'ERC1155CollectionFactory',
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    // Create collection
    const receipt = await txManager.sendTransaction(
      factoryContract,
      'createCollection',
      [uri],
      options
    );

    // Extract collection address from event logs
    const address = await this.extractCollectionAddress(receipt);

    return { address, tx: receipt };
  }

  /**
   * Mint an ERC721 NFT
   */
  async mintERC721(
    params: MintERC721Params
  ): Promise<{ tokenId: string; tx: TransactionReceipt }> {
    const { collectionAddress, recipient, tokenUri, options } = params;

    validateAddress(collectionAddress, 'collectionAddress');
    validateAddress(recipient, 'recipient');

    const txManager = this.ensureTxManager();
    this.ensureProvider(); // Ensure provider is available

    // Get ABI for the collection
    const abi = await this.contractRegistry.getABIByAddress(
      collectionAddress,
      this.getNetworkId()
    );

    // Create contract instance
    const { ethers } = await import('ethers');
    const collectionContract = new ethers.Contract(
      collectionAddress,
      abi as any[], // Cast to any[] for ethers compatibility
      this.signer
    );

    // Mint NFT
    const receipt = await txManager.sendTransaction(
      collectionContract,
      'mint',
      [recipient, tokenUri],
      options
    );

    // Extract token ID from event logs
    const tokenId = await this.extractTokenId(receipt);

    return { tokenId, tx: receipt };
  }

  /**
   * Mint an ERC1155 NFT
   */
  async mintERC1155(
    params: MintERC1155Params
  ): Promise<TransactionReceipt> {
    const { collectionAddress, recipient, tokenId, amount, data, options } =
      params;

    validateAddress(collectionAddress, 'collectionAddress');
    validateAddress(recipient, 'recipient');

    const txManager = this.ensureTxManager();
    this.ensureProvider(); // Ensure provider is available

    // Get ABI for the collection
    const abi = await this.contractRegistry.getABIByAddress(
      collectionAddress,
      this.getNetworkId()
    );

    // Create contract instance
    const { ethers } = await import('ethers');
    const collectionContract = new ethers.Contract(
      collectionAddress,
      abi as any[], // Cast to any[] for ethers compatibility
      this.signer
    );

    // Mint NFT
    return await txManager.sendTransaction(
      collectionContract,
      'mint',
      [recipient, tokenId, amount, data || '0x'],
      options
    );
  }

  /**
   * Verify collection contract and detect token standard
   */
  async verifyCollection(address: string): Promise<{
    isValid: boolean;
    tokenType: TokenStandard;
  }> {
    validateAddress(address);

    const provider = this.ensureProvider();

    try {
      const tokenType = await this.contractRegistry.verifyTokenStandard(
        address,
        provider
      );

      return {
        isValid: tokenType !== 'Unknown',
        tokenType,
      };
    } catch {
      return {
        isValid: false,
        tokenType: 'Unknown',
      };
    }
  }

  /**
   * Get collection info
   */
  async getCollectionInfo(address: string): Promise<{
    name: string;
    symbol: string;
    totalSupply: string;
    tokenType: TokenStandard;
  }> {
    validateAddress(address);

    const provider = this.ensureProvider();
    const txManager = this.ensureTxManager();

    // Verify token standard first
    const tokenType = await this.contractRegistry.verifyTokenStandard(
      address,
      provider
    );

    if (tokenType === 'Unknown') {
      throw this.error(
        ErrorCodes.CONTRACT_CALL_FAILED,
        'Unable to detect token standard'
      );
    }

    // Get ABI for the collection
    const abi = await this.contractRegistry.getABIByAddress(
      address,
      this.getNetworkId()
    );

    // Create contract instance
    const { ethers } = await import('ethers');
    const collectionContract = new ethers.Contract(address, abi as any[], provider);

    // Get collection details
    const [name, symbol, totalSupply] = await Promise.all([
      txManager.callContract<string>(collectionContract, 'name', []),
      txManager.callContract<string>(collectionContract, 'symbol', []),
      txManager.callContract<bigint>(collectionContract, 'totalSupply', []),
    ]);

    return {
      name,
      symbol,
      totalSupply: totalSupply.toString(),
      tokenType,
    };
  }

  /**
   * Extract collection address from transaction receipt
   */
  private async extractCollectionAddress(
    receipt: TransactionReceipt
  ): Promise<string> {
    // Look for CollectionCreated event in logs
    for (const log of receipt.logs) {
      try {
        // The collection address is typically the first indexed parameter
        // or can be found in the log data
        const logData = log as any; // Type assertion for event log
        if (logData.topics && logData.topics.length > 1) {
          // Assuming the address is in the first topic (after event signature)
          const { ethers } = await import('ethers');
          const address = ethers.getAddress('0x' + logData.topics[1].slice(26));
          return address;
        }
      } catch {
        continue;
      }
    }

    throw this.error(
      ErrorCodes.CONTRACT_CALL_FAILED,
      'Could not extract collection address from transaction'
    );
  }

  /**
   * Extract token ID from transaction receipt
   */
  private async extractTokenId(receipt: TransactionReceipt): Promise<string> {
    // Look for Transfer or Minted event in logs
    for (const log of receipt.logs) {
      try {
        const logData = log as any; // Type assertion for event log
        if (logData.topics && logData.topics.length > 3) {
          // For ERC721, token ID is typically the 3rd topic
          const tokenIdHex = logData.topics[3];
          const { ethers } = await import('ethers');
          const tokenId = ethers.toBigInt(tokenIdHex);
          return tokenId.toString();
        }
      } catch {
        continue;
      }
    }

    throw this.error(
      ErrorCodes.CONTRACT_CALL_FAILED,
      'Could not extract token ID from transaction'
    );
  }
}
