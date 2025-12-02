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
import { safeCall } from '../utils/helpers';

/**
 * CollectionModule handles NFT collection creation and minting
 */
export class CollectionModule extends BaseModule {
  private log(message: string, data?: unknown) {
    this.logger.debug(message, { module: 'Collection', data });
  }

  /**
   * Create a new ERC721 collection
   */
  async createERC721Collection(
    params: CreateERC721CollectionParams
  ): Promise<{ address: string; tx: TransactionReceipt }> {
    this.log('createERC721Collection started', { name: params.name, symbol: params.symbol });
    const result = await this.createCollection(params, 'ERC721CollectionFactory', 'createERC721Collection');
    this.log('createERC721Collection completed', { address: result.address, txHash: result.tx.hash });
    return result;
  }

  /**
   * Create a new ERC1155 collection
   */
  async createERC1155Collection(
    params: CreateERC1155CollectionParams
  ): Promise<{ address: string; tx: TransactionReceipt }> {
    this.log('createERC1155Collection started', { name: params.name, symbol: params.symbol });
    const result = await this.createCollection(params, 'ERC1155CollectionFactory', 'createERC1155Collection');
    this.log('createERC1155Collection completed', { address: result.address, txHash: result.tx.hash });
    return result;
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

    this.log('Getting factory contract', { factoryType });
    const factoryContract = await this.contractRegistry.getContract(
      factoryType,
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    const contractParams = await this.buildCollectionParams(collectionParams);
    this.log('Sending transaction', { methodName });

    const receipt = await txManager.sendTransaction(
      factoryContract,
      methodName,
      [contractParams],
      { ...options, module: 'Collection' }
    );

    const address = await this.extractCollectionAddress(receipt);
    this.log('Collection address extracted', { address });

    return { address, tx: receipt };
  }

  /**
   * Build CollectionParams struct for the contract
   */
  private async buildCollectionParams(params: CollectionParams) {
    const signerAddress = await this.signer!.getAddress();
    const { ethers } = await import('ethers');

    const mintPriceWei = params.mintPrice ? ethers.parseEther(params.mintPrice) : 0n;
    
    return {
      name: params.name,
      symbol: params.symbol,
      owner: params.owner || signerAddress,
      description: params.description || '',
      mintPrice: mintPriceWei,
      royaltyFee: params.royaltyFee || 0,
      maxSupply: params.maxSupply,
      // Default to maxSupply if not specified (0 blocks all minting)
      mintLimitPerWallet: params.mintLimitPerWallet ?? params.maxSupply,
      mintStartTime: params.mintStartTime || Math.floor(Date.now() / 1000),
      // Default allowlist/public prices to mintPrice if not specified
      allowlistMintPrice: params.allowlistMintPrice ? ethers.parseEther(params.allowlistMintPrice) : mintPriceWei,
      publicMintPrice: params.publicMintPrice ? ethers.parseEther(params.publicMintPrice) : mintPriceWei,
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
    this.log('mintERC721 started', { collectionAddress, recipient, value });

    validateAddress(collectionAddress, 'collectionAddress');
    validateAddress(recipient, 'recipient');

    const txManager = this.ensureTxManager();
    this.ensureProvider();

    const mintABI = ['function mint(address to) payable'];
    const { ethers } = await import('ethers');
    const collectionContract = new ethers.Contract(collectionAddress, mintABI, this.signer);

    const txOptions = { ...options, value: value || options?.value };

    this.log('Sending mint transaction');
    const receipt = await txManager.sendTransaction(collectionContract, 'mint', [recipient], { ...txOptions, module: 'Collection' });

    const tokenId = await this.extractTokenId(receipt);
    this.log('mintERC721 completed', { tokenId, txHash: receipt.hash });

    return { tokenId, tx: receipt };
  }

  /**
   * Batch mint ERC721 NFTs
   */
  async batchMintERC721(
    params: BatchMintERC721Params
  ): Promise<{ tx: TransactionReceipt }> {
    const { collectionAddress, recipient, amount, value, options } = params;
    this.log('batchMintERC721 started', { collectionAddress, recipient, amount, value });

    validateAddress(collectionAddress, 'collectionAddress');
    validateAddress(recipient, 'recipient');

    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    const txManager = this.ensureTxManager();
    this.ensureProvider();

    const batchMintABI = ['function batchMintERC721(address to, uint256 amount) payable'];
    const { ethers } = await import('ethers');
    const collectionContract = new ethers.Contract(collectionAddress, batchMintABI, this.signer);

    const txOptions = { ...options, value: value || options?.value };

    this.log('Sending batch mint transaction', { amount });
    const receipt = await txManager.sendTransaction(collectionContract, 'batchMintERC721', [recipient, amount], { ...txOptions, module: 'Collection' });
    this.log('batchMintERC721 completed', { txHash: receipt.hash });

    return { tx: receipt };
  }

  /**
   * Mint ERC1155 NFTs
   */
  async mintERC1155(
    params: MintERC1155Params
  ): Promise<{ tx: TransactionReceipt }> {
    const { collectionAddress, recipient, amount, value, options } = params;
    this.log('mintERC1155 started', { collectionAddress, recipient, amount, value });

    validateAddress(collectionAddress, 'collectionAddress');
    validateAddress(recipient, 'recipient');

    const txManager = this.ensureTxManager();
    this.ensureProvider();

    const mintABI = ['function mint(address to, uint256 amount) payable'];
    const { ethers } = await import('ethers');
    const collectionContract = new ethers.Contract(collectionAddress, mintABI, this.signer);

    const txOptions = { ...options, value: value || options?.value };

    this.log('Sending mint transaction');
    const tx = await txManager.sendTransaction(collectionContract, 'mint', [recipient, amount], { ...txOptions, module: 'Collection' });
    this.log('mintERC1155 completed', { txHash: tx.hash });

    return { tx };
  }

  /**
   * Batch mint ERC1155 NFTs
   */
  async batchMintERC1155(
    params: MintERC1155Params
  ): Promise<{ tx: TransactionReceipt }> {
    const { collectionAddress, recipient, amount, value, options } = params;
    this.log('batchMintERC1155 started', { collectionAddress, recipient, amount, value });

    validateAddress(collectionAddress, 'collectionAddress');
    validateAddress(recipient, 'recipient');

    if (amount <= 0) throw new Error('Amount must be greater than 0');

    const txManager = this.ensureTxManager();
    this.ensureProvider();

    const { ethers } = await import('ethers');
    const contract = new ethers.Contract(
      collectionAddress,
      ['function batchMintERC1155(address to, uint256 amount) payable'],
      this.signer
    );

    const txOptions = { ...options, value: value || options?.value };
    const tx = await txManager.sendTransaction(contract, 'batchMintERC1155', [recipient, amount], { ...txOptions, module: 'Collection' });
    this.log('batchMintERC1155 completed', { txHash: tx.hash });

    return { tx };
  }

  /**
   * Verify collection contract and detect token standard
   */
  async verifyCollection(address: string): Promise<{
    isValid: boolean;
    tokenType: TokenStandard;
  }> {
    this.log('verifyCollection started', { address });
    validateAddress(address);

    const provider = this.ensureProvider();

    try {
      const tokenType = await this.contractRegistry.verifyTokenStandard(address, provider);
      this.log('verifyCollection completed', { address, tokenType, isValid: tokenType !== 'Unknown' });
      return { isValid: tokenType !== 'Unknown', tokenType };
    } catch {
      this.log('verifyCollection failed', { address });
      return { isValid: false, tokenType: 'Unknown' };
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
    description: string;
    maxSupply: string;
    mintPrice: string;
    royaltyFee: number;
    mintLimitPerWallet: number;
    owner: string;
  }> {
    this.log('getCollectionInfo started', { address });
    validateAddress(address);

    const provider = this.ensureProvider();

    const tokenType = await this.contractRegistry.verifyTokenStandard(address, provider);
    if (tokenType === 'Unknown') {
      this.log('getCollectionInfo failed - unknown token standard', { address });
      throw this.error(ErrorCodes.CONTRACT_CALL_FAILED, 'Unable to detect token standard');
    }
    this.log('Token standard detected', { address, tokenType });

    const minimalABI = [
      'function name() view returns (string)',
      'function symbol() view returns (string)',
      'function getDescription() view returns (string)',
      'function getRoyaltyFee() view returns (uint256)',
      'function owner() view returns (address)',
      'function getMintInfo(address) view returns (uint256,uint256,uint256,uint8,uint256,uint256,uint256,uint256,uint256,uint256,uint256,bool)',
      'function getTotalMinted() view returns (uint256)',
      'function totalSupply() view returns (uint256)',
    ];

    const { ethers } = await import('ethers');
    const contract = new ethers.Contract(address, minimalABI, provider);

    const [name, symbol, description, royaltyFee, owner] = await Promise.all([
      safeCall(() => contract.name(), 'Unknown Collection'),
      safeCall(() => contract.symbol(), 'UNKNOWN'),
      safeCall(() => contract.getDescription(), ''),
      safeCall(() => contract.getRoyaltyFee().then((v: bigint) => Number(v)), 0),
      safeCall(() => contract.owner(), ''),
    ]);

    let totalSupply = '0';
    let maxSupply = '0';
    let mintPrice = '0';
    let mintLimitPerWallet = 0;

    // getMintInfo returns all mint data in one call (Zuno collections)
    const mintInfo = await safeCall(() => contract.getMintInfo(ethers.ZeroAddress), null);
    if (mintInfo) {
      totalSupply = mintInfo[7].toString();
      maxSupply = mintInfo[8].toString();
      mintPrice = ethers.formatEther(mintInfo[4]);
      mintLimitPerWallet = Number(mintInfo[10]);
      this.log('getMintInfo success', { totalSupply, maxSupply, mintPrice, mintLimitPerWallet });
    } else {
      this.log('getMintInfo not available, using fallback');
      totalSupply = await safeCall(
        () => contract.getTotalMinted().then((v: bigint) => v.toString()),
        await safeCall(() => contract.totalSupply().then((v: bigint) => v.toString()), '0')
      );
    }

    this.log('getCollectionInfo completed', { name, symbol, totalSupply, maxSupply, owner });
    return {
      name,
      symbol,
      totalSupply,
      tokenType,
      description,
      maxSupply,
      mintPrice,
      royaltyFee,
      mintLimitPerWallet,
      owner,
    };
  }

  /**
   * Get all created collections from factory events
   * @param options - Optional filter options
   * @returns Array of collection addresses with creator info
   */
  async getCreatedCollections(options?: {
    creator?: string;
    fromBlock?: number;
    toBlock?: number | 'latest';
  }): Promise<Array<{
    address: string;
    creator: string;
    blockNumber: number;
    transactionHash: string;
    type: 'ERC721' | 'ERC1155';
  }>> {
    this.log('getCreatedCollections started', options);
    const provider = this.ensureProvider();
    const { ethers } = await import('ethers');

    // Get factory contract addresses
    const erc721Factory = await this.contractRegistry.getContract(
      'ERC721CollectionFactory',
      this.getNetworkId(),
      provider
    );
    const erc1155Factory = await this.contractRegistry.getContract(
      'ERC1155CollectionFactory',
      this.getNetworkId(),
      provider
    );

    const ERC721_CREATED_SIG = ethers.id('ERC721CollectionCreated(address,address)');
    const ERC1155_CREATED_SIG = ethers.id('ERC1155CollectionCreated(address,address)');

    const fromBlock = options?.fromBlock ?? 0;
    const toBlock = options?.toBlock ?? 'latest';

    const collections: Array<{
      address: string;
      creator: string;
      blockNumber: number;
      transactionHash: string;
      type: 'ERC721' | 'ERC1155';
    }> = [];

    // Fetch ERC721 collection events
    try {
      const erc721Logs = await provider.getLogs({
        address: await erc721Factory.getAddress(),
        topics: [
          ERC721_CREATED_SIG,
          null,
          options?.creator ? ethers.zeroPadValue(options.creator, 32) : null,
        ],
        fromBlock,
        toBlock,
      });

      for (const log of erc721Logs) {
        const collectionAddress = ethers.getAddress('0x' + log.topics[1].slice(26));
        const creator = ethers.getAddress('0x' + log.topics[2].slice(26));
        collections.push({
          address: collectionAddress,
          creator,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
          type: 'ERC721',
        });
      }
    } catch (error) {
      this.log('Failed to fetch ERC721 events', error);
    }

    // Fetch ERC1155 collection events
    try {
      const erc1155Logs = await provider.getLogs({
        address: await erc1155Factory.getAddress(),
        topics: [
          ERC1155_CREATED_SIG,
          null,
          options?.creator ? ethers.zeroPadValue(options.creator, 32) : null,
        ],
        fromBlock,
        toBlock,
      });

      for (const log of erc1155Logs) {
        const collectionAddress = ethers.getAddress('0x' + log.topics[1].slice(26));
        const creator = ethers.getAddress('0x' + log.topics[2].slice(26));
        collections.push({
          address: collectionAddress,
          creator,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
          type: 'ERC1155',
        });
      }
    } catch (error) {
      this.log('Failed to fetch ERC1155 events', error);
    }

    // Sort by block number descending (newest first)
    collections.sort((a, b) => b.blockNumber - a.blockNumber);

    this.log('getCreatedCollections completed', { count: collections.length });
    return collections;
  }

  /**
   * Get tokens minted by a user (internal - doesn't verify current ownership)
   */
  private async getMintedTokens(
    collectionAddress: string,
    userAddress: string
  ): Promise<Array<{ tokenId: string; amount: number }>> {
    this.log('getMintedTokens started', { collectionAddress, userAddress });
    validateAddress(collectionAddress, 'collectionAddress');
    validateAddress(userAddress, 'userAddress');

    const provider = this.ensureProvider();
    const { ethers } = await import('ethers');
    
    // Normalize addresses to proper checksum format
    const normalizedCollection = ethers.getAddress(collectionAddress);
    const normalizedUser = ethers.getAddress(userAddress);
    
    const tokensMap = new Map<string, number>();

    // 1. Check custom Minted event (Zuno collections)
    const mintedLogs = await safeCall(
      () => provider.getLogs({
        address: normalizedCollection,
        topics: [
          ethers.id('Minted(address,uint256,uint256)'),
          ethers.zeroPadValue(normalizedUser, 32),
        ],
        fromBlock: 0,
        toBlock: 'latest',
      }),
      []
    );
    this.log('Minted logs found', { count: mintedLogs.length });

    for (const log of mintedLogs) {
      const tokenId = ethers.toBigInt(log.topics[2]).toString();
      const amount = Number(ethers.toBigInt(log.data));
      tokensMap.set(tokenId, (tokensMap.get(tokenId) || 0) + amount);
    }

    // 2. Check ERC-1155 TransferSingle events (mint = from zero address to user)
    // TransferSingle(operator, from, to, id, value) - from=zero means mint
    const transferSingleLogs = await safeCall(
      () => provider.getLogs({
        address: normalizedCollection,
        topics: [
          ethers.id('TransferSingle(address,address,address,uint256,uint256)'),
          null, // operator (any)
          ethers.zeroPadValue(ethers.ZeroAddress, 32), // from = zero (mint)
          ethers.zeroPadValue(normalizedUser, 32), // to = user
        ],
        fromBlock: 0,
        toBlock: 'latest',
      }),
      []
    );
    this.log('TransferSingle (mint) logs found', { count: transferSingleLogs.length });

    for (const log of transferSingleLogs) {
      // data contains: id (uint256), value (uint256)
      const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['uint256', 'uint256'], log.data);
      const tokenId = decoded[0].toString();
      const amount = Number(decoded[1]);
      tokensMap.set(tokenId, (tokensMap.get(tokenId) || 0) + amount);
    }

    // 3. Check ERC-1155 TransferBatch events (mint = from zero address to user)
    // TransferBatch(operator, from, to, ids[], values[])
    const transferBatchLogs = await safeCall(
      () => provider.getLogs({
        address: normalizedCollection,
        topics: [
          ethers.id('TransferBatch(address,address,address,uint256[],uint256[])'),
          null, // operator (any)
          ethers.zeroPadValue(ethers.ZeroAddress, 32), // from = zero (mint)
          ethers.zeroPadValue(normalizedUser, 32), // to = user
        ],
        fromBlock: 0,
        toBlock: 'latest',
      }),
      []
    );
    this.log('TransferBatch (mint) logs found', { count: transferBatchLogs.length });

    for (const log of transferBatchLogs) {
      // data contains: ids (uint256[]), values (uint256[])
      const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['uint256[]', 'uint256[]'], log.data);
      const ids = decoded[0] as bigint[];
      const values = decoded[1] as bigint[];
      for (let i = 0; i < ids.length; i++) {
        const tokenId = ids[i].toString();
        const amount = Number(values[i]);
        tokensMap.set(tokenId, (tokensMap.get(tokenId) || 0) + amount);
      }
    }

    // 4. Check ERC-721 Transfer events (mint = from zero address to user)
    const erc721TransferLogs = await safeCall(
      () => provider.getLogs({
        address: normalizedCollection,
        topics: [
          ethers.id('Transfer(address,address,uint256)'),
          ethers.zeroPadValue(ethers.ZeroAddress, 32), // from = zero (mint)
          ethers.zeroPadValue(normalizedUser, 32), // to = user
        ],
        fromBlock: 0,
        toBlock: 'latest',
      }),
      []
    );
    this.log('ERC721 Transfer (mint) logs found', { count: erc721TransferLogs.length });

    for (const log of erc721TransferLogs) {
      const tokenId = ethers.toBigInt(log.topics[3]).toString();
      tokensMap.set(tokenId, 1); // ERC-721 always amount = 1
    }

    const tokens = Array.from(tokensMap.entries()).map(([tokenId, amount]) => ({ tokenId, amount }));
    this.log('getMintedTokens completed', { count: tokens.length, tokens });
    return tokens;
  }

  /**
   * Get tokens currently owned by a user from a specific collection
   * Verifies actual on-chain ownership using ownerOf/balanceOf
   */
  async getUserOwnedTokens(
    collectionAddress: string,
    userAddress: string
  ): Promise<Array<{ tokenId: string; amount: number }>> {
    this.log('getUserOwnedTokens started', { collectionAddress, userAddress });
    validateAddress(collectionAddress, 'collectionAddress');
    validateAddress(userAddress, 'userAddress');

    const { ethers } = await import('ethers');
    
    // Normalize addresses to proper checksum format
    const normalizedCollection = ethers.getAddress(collectionAddress);
    const normalizedUser = ethers.getAddress(userAddress);

    // First get minted tokens as candidates
    const mintedTokens = await this.getMintedTokens(normalizedCollection, normalizedUser);
    
    if (mintedTokens.length === 0) {
      return [];
    }

    const provider = this.ensureProvider();

    const ERC721_ABI = ['function ownerOf(uint256 tokenId) view returns (address)'];
    const ERC1155_ABI = ['function balanceOf(address account, uint256 id) view returns (uint256)'];

    const erc721Contract = new ethers.Contract(normalizedCollection, ERC721_ABI, provider);
    const erc1155Contract = new ethers.Contract(normalizedCollection, ERC1155_ABI, provider);

    const ownedTokens: Array<{ tokenId: string; amount: number }> = [];

    for (const token of mintedTokens) {
      try {
        // Try ERC721 ownerOf first
        const owner = await erc721Contract.ownerOf(token.tokenId);
        if (owner.toLowerCase() === normalizedUser.toLowerCase()) {
          ownedTokens.push({ tokenId: token.tokenId, amount: 1 });
        }
      } catch {
        // Fallback to ERC1155 balanceOf
        try {
          const balance = await erc1155Contract.balanceOf(normalizedUser, token.tokenId);
          if (balance > 0n) {
            ownedTokens.push({ tokenId: token.tokenId, amount: Number(balance) });
          }
        } catch {
          // Token not owned or invalid - skip
        }
      }
    }

    this.log('getUserOwnedTokens completed', { count: ownedTokens.length });
    return ownedTokens;
  }

  /**
   * Extract collection address from transaction receipt
   */
  private async extractCollectionAddress(
    receipt: TransactionReceipt
  ): Promise<string> {
    const { ethers } = await import('ethers');

    // Event signatures for collection creation
    const ERC721_CREATED_SIG = ethers.id('ERC721CollectionCreated(address,address)');
    const ERC1155_CREATED_SIG = ethers.id('ERC1155CollectionCreated(address,address)');

    // Look for CollectionCreated event in logs
    for (const logEntry of receipt.logs) {
      try {
        const log = logEntry as { topics?: string[]; address?: string };
        const topics = log.topics || [];

        if (topics.length < 2) continue;

        const eventSig = topics[0];

        if (eventSig === ERC721_CREATED_SIG || eventSig === ERC1155_CREATED_SIG) {
          const address = ethers.getAddress('0x' + topics[1].slice(26));
          if (address !== ethers.ZeroAddress) {
            return address;
          }
        }
      } catch {
        continue;
      }
    }

    // Fallback: try to find any valid address in topics
    for (const logEntry of receipt.logs) {
      try {
        const log = logEntry as { topics?: string[] };
        const topics = log.topics || [];
        if (topics.length >= 2) {
          const address = ethers.getAddress('0x' + topics[1].slice(26));
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

  /**
   * Add addresses to collection allowlist for allowlist-only minting
   *
   * When allowlist mode is enabled, only addresses on the allowlist
   * can mint NFTs from the collection. This is useful for whitelist
   * sales and restricted access minting.
   *
   * @param collectionAddress - The collection contract address
   * @param addresses - Array of wallet addresses to add (max 100)
   *
   * @returns Promise resolving to transaction receipt
   *
   * @throws {ZunoSDKError} INVALID_ADDRESS - If collection address is invalid
   * @throws {ZunoSDKError} INVALID_AMOUNT - If addresses array is empty or exceeds 100
   * @throws {ZunoSDKError} TRANSACTION_FAILED - If transaction fails
   * @throws {ZunoSDKError} NOT_OWNER - If caller is not collection owner
   *
   * @example
   * ```typescript
   * // Add addresses to allowlist
   * const { tx } = await sdk.collection.addToAllowlist(
   *   "0x1234...",
   *   [
   *     "0xabc...", // User 1
   *     "0xdef...", // User 2
   *     "0x123...", // User 3
   *   ]
   * );
   * console.log('Added to allowlist:', tx.transactionHash);
   * ```
   */
  async addToAllowlist(
    collectionAddress: string,
    addresses: string[]
  ): Promise<{ tx: TransactionReceipt }> {
    this.log('addToAllowlist started', { collectionAddress, count: addresses.length });
    
    validateAddress(collectionAddress, 'collectionAddress');
    if (addresses.length === 0) {
      throw this.error('INVALID_AMOUNT', 'addresses array cannot be empty');
    }
    if (addresses.length > 100) {
      throw this.error('INVALID_AMOUNT', 'Maximum 100 addresses per batch');
    }

    const txManager = this.ensureTxManager();
    const { ethers } = await import('ethers');
    
    const abi = ['function addToAllowlist(address[] calldata addresses) external'];
    const contract = new ethers.Contract(collectionAddress, abi, this.signer);

    const tx = await txManager.sendTransaction(contract, 'addToAllowlist', [addresses], { module: 'Collection' });
    this.log('addToAllowlist completed', { txHash: tx.hash });

    return { tx };
  }

  /**
   * Remove addresses from collection allowlist
   *
   * Removes wallet addresses from the collection's allowlist. Removed
   * addresses will no longer be able to mint when allowlist mode is enabled.
   *
   * @param collectionAddress - The collection contract address
   * @param addresses - Array of wallet addresses to remove
   *
   * @returns Promise resolving to transaction receipt
   *
   * @throws {ZunoSDKError} INVALID_ADDRESS - If collection address is invalid
   * @throws {ZunoSDKError} INVALID_AMOUNT - If addresses array is empty
   * @throws {ZunoSDKError} TRANSACTION_FAILED - If transaction fails
   * @throws {ZunoSDKError} NOT_OWNER - If caller is not collection owner
   *
   * @example
   * ```typescript
   * // Remove addresses from allowlist
   * const { tx } = await sdk.collection.removeFromAllowlist(
   *   "0x1234...",
   *   ["0xabc...", "0xdef..."]
   * );
   * console.log('Removed from allowlist:', tx.transactionHash);
   * ```
   */
  async removeFromAllowlist(
    collectionAddress: string,
    addresses: string[]
  ): Promise<{ tx: TransactionReceipt }> {
    this.log('removeFromAllowlist started', { collectionAddress, count: addresses.length });
    
    validateAddress(collectionAddress, 'collectionAddress');
    if (addresses.length === 0) {
      throw this.error('INVALID_AMOUNT', 'addresses array cannot be empty');
    }

    const txManager = this.ensureTxManager();
    const { ethers } = await import('ethers');
    
    const abi = ['function removeFromAllowlist(address[] calldata addresses) external'];
    const contract = new ethers.Contract(collectionAddress, abi, this.signer);

    const tx = await txManager.sendTransaction(contract, 'removeFromAllowlist', [addresses], { module: 'Collection' });
    this.log('removeFromAllowlist completed', { txHash: tx.hash });

    return { tx };
  }

  /**
   * Enable or disable allowlist-only minting mode for a collection
   *
   * When enabled, only addresses on the allowlist can mint NFTs.
   * When disabled, anyone can mint NFTs (public minting).
   *
   * @param collectionAddress - The collection contract address
   * @param enabled - True to enable allowlist mode, false to disable
   *
   * @returns Promise resolving to transaction receipt
   *
   * @throws {ZunoSDKError} INVALID_ADDRESS - If collection address is invalid
   * @throws {ZunoSDKError} TRANSACTION_FAILED - If transaction fails
   * @throws {ZunoSDKError} NOT_OWNER - If caller is not collection owner
   *
   * @example
   * ```typescript
   * // Enable allowlist-only mode
   * await sdk.collection.setAllowlistOnly("0x1234...", true);
   *
   * // Disable allowlist-only mode (open public minting)
   * await sdk.collection.setAllowlistOnly("0x1234...", false);
   * ```
   */
  async setAllowlistOnly(
    collectionAddress: string,
    enabled: boolean
  ): Promise<{ tx: TransactionReceipt }> {
    this.log('setAllowlistOnly started', { collectionAddress, enabled });
    
    validateAddress(collectionAddress, 'collectionAddress');

    const txManager = this.ensureTxManager();
    const { ethers } = await import('ethers');
    
    const abi = ['function setAllowlistOnly(bool allowlistOnly) external'];
    const contract = new ethers.Contract(collectionAddress, abi, this.signer);

    const tx = await txManager.sendTransaction(contract, 'setAllowlistOnly', [enabled], { module: 'Collection' });
    this.log('setAllowlistOnly completed', { txHash: tx.hash });

    return { tx };
  }

  /**
   * Check if an address is on the collection's allowlist
   *
   * @param collectionAddress - The collection contract address
   * @param address - The wallet address to check
   *
   * @returns Promise resolving to true if address is on allowlist, false otherwise
   *
   * @throws {ZunoSDKError} INVALID_ADDRESS - If collection or address is invalid
   *
   * @example
   * ```typescript
   * const isAllowed = await sdk.collection.isInAllowlist(
   *   "0x1234...",
   *   "0xabc..."
   * );
   * if (isAllowed) {
   *   console.log('Address can mint during allowlist phase');
   * }
   * ```
   */
  async isInAllowlist(collectionAddress: string, address: string): Promise<boolean> {
    validateAddress(collectionAddress, 'collectionAddress');
    validateAddress(address, 'address');

    const provider = this.ensureProvider();
    const { ethers } = await import('ethers');
    
    const abi = ['function isInAllowlist(address account) external view returns (bool)'];
    const contract = new ethers.Contract(collectionAddress, abi, provider);

    return await contract.isInAllowlist(address);
  }

  /**
   * Check if a collection is in allowlist-only minting mode
   *
   * @param collectionAddress - The collection contract address
   *
   * @returns Promise resolving to true if allowlist mode is enabled, false otherwise
   *
   * @throws {ZunoSDKError} INVALID_ADDRESS - If collection address is invalid
   *
   * @example
   * ```typescript
   * const isRestricted = await sdk.collection.isAllowlistOnly("0x1234...");
   * if (isRestricted) {
   *   console.log('Collection requires allowlist for minting');
   * } else {
   *   console.log('Collection is open for public minting');
   * }
   * ```
   */
  async isAllowlistOnly(collectionAddress: string): Promise<boolean> {
    validateAddress(collectionAddress, 'collectionAddress');

    const provider = this.ensureProvider();
    const { ethers } = await import('ethers');
    
    const abi = ['function isAllowlistOnly() external view returns (bool)'];
    const contract = new ethers.Contract(collectionAddress, abi, provider);

    return await contract.isAllowlistOnly();
  }
}
