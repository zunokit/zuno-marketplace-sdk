/**
 * Collection Module for NFT collection management
 */

import { BaseModule } from './BaseModule';
import type {
  CollectionParams,
  CreateERC721CollectionParams,
  CreateERC1155CollectionParams,
  MintERC721Params,
  BatchMintERC721Params,
  MintERC1155Params,
  TokenStandard,
  ContractType,
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
    return this.createCollection(params, 'ERC721CollectionFactory', 'createERC721Collection');
  }

  /**
   * Create a new ERC1155 collection
   */
  async createERC1155Collection(
    params: CreateERC1155CollectionParams
  ): Promise<{ address: string; tx: TransactionReceipt }> {
    return this.createCollection(params, 'ERC1155CollectionFactory', 'createERC1155Collection');
  }

  /**
   * Internal method to create a collection
   */
  private async createCollection(
    params: (CreateERC721CollectionParams | CreateERC1155CollectionParams),
    factoryType: ContractType,
    methodName: string
  ): Promise<{ address: string; tx: TransactionReceipt }> {
    const { options, ...collectionParams } = params;

    const txManager = this.ensureTxManager();
    const provider = this.ensureProvider();
    this.ensureSigner();

    const factoryContract = await this.contractRegistry.getContract(
      factoryType,
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    const contractParams = await this.buildCollectionParams(collectionParams);

    const receipt = await txManager.sendTransaction(
      factoryContract,
      methodName,
      [contractParams],
      options
    );

    const address = await this.extractCollectionAddress(receipt);

    return { address, tx: receipt };
  }

  /**
   * Build CollectionParams struct for the contract
   */
  private async buildCollectionParams(params: CollectionParams) {
    const signerAddress = await this.signer!.getAddress();
    const { ethers } = await import('ethers');

    return {
      name: params.name,
      symbol: params.symbol,
      owner: params.owner || signerAddress,
      description: params.description || '',
      mintPrice: params.mintPrice ? ethers.parseEther(params.mintPrice) : 0n,
      royaltyFee: params.royaltyFee || 0,
      maxSupply: params.maxSupply,
      mintLimitPerWallet: params.mintLimitPerWallet || 0,
      mintStartTime: params.mintStartTime || 0,
      allowlistMintPrice: params.allowlistMintPrice ? ethers.parseEther(params.allowlistMintPrice) : 0n,
      publicMintPrice: params.publicMintPrice ? ethers.parseEther(params.publicMintPrice) : 0n,
      allowlistStageDuration: params.allowlistStageDuration || 0,
      tokenURI: params.tokenURI || '',
    };
  }

  /**
   * Mint an ERC721 NFT
   */
  async mintERC721(
    params: MintERC721Params
  ): Promise<{ tokenId: string; tx: TransactionReceipt }> {
    const { collectionAddress, recipient, value, options } = params;

    validateAddress(collectionAddress, 'collectionAddress');
    validateAddress(recipient, 'recipient');

    const txManager = this.ensureTxManager();
    this.ensureProvider(); // Ensure provider is available

    // Minimal ABI for ERC721 mint function
    const mintABI = [
      'function mint(address to) payable',
    ];

    // Create contract instance
    const { ethers } = await import('ethers');
    const collectionContract = new ethers.Contract(
      collectionAddress,
      mintABI,
      this.signer
    );

    // Prepare transaction options with value (for payable mint)
    const txOptions = {
      ...options,
      value: value || options?.value,
    };

    // Mint NFT - contract expects: (address to) payable
    const receipt = await txManager.sendTransaction(
      collectionContract,
      'mint',
      [recipient],
      txOptions
    );

    // Extract token ID from event logs
    const tokenId = await this.extractTokenId(receipt);

    return { tokenId, tx: receipt };
  }

  /**
   * Batch mint ERC721 NFTs
   */
  async batchMintERC721(
    params: BatchMintERC721Params
  ): Promise<{ tx: TransactionReceipt }> {
    const { collectionAddress, recipient, amount, value, options } = params;

    validateAddress(collectionAddress, 'collectionAddress');
    validateAddress(recipient, 'recipient');

    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    const txManager = this.ensureTxManager();
    this.ensureProvider(); // Ensure provider is available

    // Minimal ABI for ERC721 batch mint function
    const batchMintABI = [
      'function batchMintERC721(address to, uint256 amount) payable',
    ];

    // Create contract instance
    const { ethers } = await import('ethers');
    const collectionContract = new ethers.Contract(
      collectionAddress,
      batchMintABI,
      this.signer
    );

    // Prepare transaction options with value (for payable mint)
    const txOptions = {
      ...options,
      value: value || options?.value,
    };

    // Batch mint NFTs - contract expects: (address to, uint256 amount) payable
    const receipt = await txManager.sendTransaction(
      collectionContract,
      'batchMintERC721',
      [recipient, amount],
      txOptions
    );

    return { tx: receipt };
  }

  /**
   * Mint an ERC1155 NFT
   */
  async mintERC1155(
    params: MintERC1155Params
  ): Promise<{ tx: TransactionReceipt }> {
    const { collectionAddress, recipient, tokenId, amount, data, options } =
      params;

    validateAddress(collectionAddress, 'collectionAddress');
    validateAddress(recipient, 'recipient');

    const txManager = this.ensureTxManager();
    this.ensureProvider(); // Ensure provider is available

    // Minimal ABI for ERC1155 mint function
    const mintABI = [
      'function mint(address to, uint256 id, uint256 amount, bytes data) payable',
    ];

    // Create contract instance
    const { ethers } = await import('ethers');
    const collectionContract = new ethers.Contract(
      collectionAddress,
      mintABI,
      this.signer
    );

    // Mint NFT
    const tx = await txManager.sendTransaction(
      collectionContract,
      'mint',
      [recipient, tokenId, amount, data || '0x'],
      options
    );

    return { tx };
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

    // Use minimal ABI for standard ERC721/ERC1155 view functions
    // These are standard across all collections regardless of implementation
    const minimalABI = [
      'function name() view returns (string)',
      'function symbol() view returns (string)',
      'function totalSupply() view returns (uint256)',
    ];

    // Create contract instance with minimal ABI
    const { ethers } = await import('ethers');
    const collectionContract = new ethers.Contract(address, minimalABI, provider);

    // Get collection details
    const [name, symbol, totalSupply] = await Promise.all([
      collectionContract.name() as Promise<string>,
      collectionContract.symbol() as Promise<string>,
      collectionContract.totalSupply() as Promise<bigint>,
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
    const { ethers } = await import('ethers');
    
    // Debug: log receipt info
    console.log('[SDK] extractCollectionAddress - logs count:', receipt.logs?.length || 0);
    console.log('[SDK] extractCollectionAddress - receipt status:', receipt.status);
    
    // Event signatures for collection creation
    const ERC721_CREATED_SIG = ethers.id('ERC721CollectionCreated(address,address)');
    const ERC1155_CREATED_SIG = ethers.id('ERC1155CollectionCreated(address,address)');
    
    console.log('[SDK] Looking for event sigs:', { ERC721_CREATED_SIG, ERC1155_CREATED_SIG });

    // Look for CollectionCreated event in logs
    for (let i = 0; i < receipt.logs.length; i++) {
      const logEntry = receipt.logs[i];
      try {
        // ethers v6 log structure
        const log = logEntry as any;
        const topics = log.topics || [];
        
        console.log(`[SDK] Log ${i}:`, {
          address: log.address,
          topicsCount: topics.length,
          topic0: topics[0],
          topic1: topics[1],
        });

        if (topics.length < 2) {
          continue;
        }

        const eventSig = topics[0];
        
        // Check if this is a collection created event
        if (eventSig === ERC721_CREATED_SIG || eventSig === ERC1155_CREATED_SIG) {
          console.log('[SDK] Found collection created event!');
          // Collection address is the first indexed parameter (topic[1])
          const address = ethers.getAddress('0x' + topics[1].slice(26));
          console.log('[SDK] Extracted address:', address);
          if (address !== ethers.ZeroAddress) {
            return address;
          }
        }
      } catch (err) {
        console.log(`[SDK] Error parsing log ${i}:`, err);
        continue;
      }
    }

    // Fallback: try to find any valid address in topics (skip first log which is usually proxy)
    console.log('[SDK] Fallback: searching for valid address in all logs');
    for (let i = 0; i < receipt.logs.length; i++) {
      const logEntry = receipt.logs[i];
      try {
        const log = logEntry as any;
        const topics = log.topics || [];
        if (topics.length >= 2) {
          const address = ethers.getAddress('0x' + topics[1].slice(26));
          console.log(`[SDK] Fallback log ${i} address:`, address);
          if (address !== ethers.ZeroAddress) {
            return address;
          }
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
    for (const logEntry of receipt.logs) {
      try {
        const log = logEntry as { topics?: string[] };
        if (log.topics && Array.isArray(log.topics) && log.topics.length > 3) {
          // For ERC721, token ID is typically the 3rd topic
          const tokenIdHex = log.topics[3];
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
