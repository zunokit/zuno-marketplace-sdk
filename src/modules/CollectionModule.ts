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
   * Mint an ERC1155 NFT
   */
  async mintERC1155(
    params: MintERC1155Params
  ): Promise<{ tx: TransactionReceipt }> {
    const { collectionAddress, recipient, tokenId, amount, data, options } = params;
    this.log('mintERC1155 started', { collectionAddress, recipient, tokenId, amount });

    validateAddress(collectionAddress, 'collectionAddress');
    validateAddress(recipient, 'recipient');

    const txManager = this.ensureTxManager();
    this.ensureProvider();

    const mintABI = ['function mint(address to, uint256 id, uint256 amount, bytes data) payable'];
    const { ethers } = await import('ethers');
    const collectionContract = new ethers.Contract(collectionAddress, mintABI, this.signer);

    this.log('Sending mint transaction');
    const tx = await txManager.sendTransaction(collectionContract, 'mint', [recipient, tokenId, amount, data || '0x'], { ...options, module: 'Collection' });
    this.log('mintERC1155 completed', { txHash: tx.hash });

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
}
