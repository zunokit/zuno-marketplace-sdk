/**
 * Collection Hooks Examples
 *
 * This file demonstrates how to use all collection-related React hooks
 *
 * @module examples/react/collection-hooks
 */

'use client';

import React from 'react';
import {
  useCollection,
  useCollectionInfo,
  useCreatedCollections,
  useUserOwnedTokens,
  useIsInAllowlist,
  useIsAllowlistOnly,
  useSetupAllowlist,
  useOwnerMint,
  useWallet,
} from 'zuno-marketplace-sdk/react';

// ============================================================================
// CREATE ERC721 COLLECTION
// ============================================================================

/**
 * Create a new ERC721 collection
 */
export function CreateCollectionExample() {
  const { createERC721 } = useCollection();
  const { address } = useWallet();

  const handleCreate = async () => {
    try {
      const result = await createERC721.mutateAsync({
        name: 'My NFT Collection',
        symbol: 'MNC',
        maxSupply: 10000,
        mintPrice: '0.1',
        royaltyFee: 500,
        tokenURI: 'ipfs://...',
      });

      console.log('Collection created:', result.address);
    } catch (error) {
      console.error('Failed to create collection:', error);
    }
  };

  return (
    <div>
      <h2>Create Collection</h2>
      <button
        onClick={handleCreate}
        disabled={createERC721.isPending}
      >
        {createERC721.isPending ? 'Creating...' : 'Create ERC721 Collection'}
      </button>

      {createERC721.isSuccess && (
        <p>✅ Collection created: {createERC721.data?.address}</p>
      )}

      {createERC721.isError && (
        <p>❌ Error: {createERC721.error?.message}</p>
      )}
    </div>
  );
}

// ============================================================================
// MINT ERC721 NFT
// ============================================================================

/**
 * Mint a single ERC721 NFT
 */
export function MintNFTExample() {
  const { mintERC721 } = useCollection();
  const { address, isConnected } = useWallet();

  const [collectionAddress, setCollectionAddress] = React.useState('');
  const [recipient, setRecipient] = React.useState('');
  const [value, setValue] = React.useState('0.1');

  const handleMint = async () => {
    if (!isConnected) {
      alert('Please connect your wallet');
      return;
    }

    try {
      const result = await mintERC721.mutateAsync({
        collectionAddress,
        recipient: recipient || address!,
        value,
      });

      console.log('NFT minted:', result.tokenId);
    } catch (error) {
      console.error('Mint failed:', error);
    }
  };

  return (
    <div>
      <h2>Mint NFT</h2>
      <input
        placeholder="Collection Address"
        value={collectionAddress}
        onChange={(e) => setCollectionAddress(e.target.value)}
      />
      <input
        placeholder="Recipient Address"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
      />
      <input
        placeholder="Mint Price (ETH)"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button
        onClick={handleMint}
        disabled={!isConnected || mintERC721.isPending}
      >
        {mintERC721.isPending ? 'Minting...' : 'Mint NFT'}
      </button>

      {mintERC721.isSuccess && (
        <p>✅ NFT minted! Token ID: {mintERC721.data?.tokenId}</p>
      )}
    </div>
  );
}

// ============================================================================
// BATCH MINT ERC721
// ============================================================================

/**
 * Mint multiple ERC721 NFTs in one transaction
 */
export function BatchMintExample() {
  const { batchMintERC721 } = useCollection();
  const { address, isConnected } = useWallet();

  const handleBatchMint = async () => {
    if (!isConnected) return;

    try {
      await batchMintERC721.mutateAsync({
        collectionAddress: '0x...',
        recipient: address!,
        amount: 5,
        value: '0.5',
      });

      console.log('Batch minted 5 NFTs');
    } catch (error) {
      console.error('Batch mint failed:', error);
    }
  };

  return (
    <div>
      <h2>Batch Mint</h2>
      <button
        onClick={handleBatchMint}
        disabled={!isConnected || batchMintERC721.isPending}
      >
        {batchMintERC721.isPending ? 'Minting...' : 'Batch Mint (5 NFTs)'}
      </button>
    </div>
  );
}

// ============================================================================
// GET COLLECTION INFO
// ============================================================================

/**
 * Display collection information
 */
export function CollectionInfoDisplay({ collectionAddress }: { collectionAddress: string }) {
  const { data, isLoading, error } = useCollectionInfo(collectionAddress);

  if (isLoading) return <div>Loading collection info...</div>;
  if (error) return <div>Error loading collection</div>;
  if (!data) return null;

  return (
    <div>
      <h3>{data.name}</h3>
      <p>Symbol: {data.symbol}</p>
      <p>Type: {data.tokenType}</p>
      <p>Total Supply: {data.totalSupply} / {data.maxSupply}</p>
      <p>Mint Price: {data.mintPrice} ETH</p>
      <p>Owner: {data.owner}</p>
    </div>
  );
}

// ============================================================================
// GET USER OWNED TOKENS
// ============================================================================

/**
 * Display all tokens owned by a user from a collection
 */
export function UserTokensDisplay({
  collectionAddress,
  userAddress,
}: {
  collectionAddress: string;
  userAddress: string;
}) {
  const { data, isLoading } = useUserOwnedTokens(collectionAddress, userAddress);

  if (isLoading) return <div>Loading tokens...</div>;
  if (!data || data.length === 0) return <p>No tokens owned</p>;

  return (
    <div>
      <h3>Your Tokens ({data.length})</h3>
      <ul>
        {data.map((token) => (
          <li key={token.tokenId}>
            Token #{token.tokenId} (Amount: {token.amount})
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// ALLOWLIST MANAGEMENT
// ============================================================================

/**
 * Allowlist management component
 */
export function AllowlistManager({ collectionAddress }: { collectionAddress: string }) {
  const { addToAllowlist, removeFromAllowlist } = useCollection();
  const { address } = useWallet();

  const [newAddress, setNewAddress] = React.useState('');

  // Check if user is on allowlist
  const { data: isAllowed } = useIsInAllowlist(collectionAddress, address!);

  // Check if allowlist-only mode is enabled
  const { data: isAllowlistOnly } = useIsAllowlistOnly(collectionAddress);

  const handleAdd = async () => {
    try {
      await addToAllowlist.mutateAsync({
        collectionAddress,
        addresses: [newAddress],
      });
      setNewAddress('');
      console.log('Added to allowlist');
    } catch (error) {
      console.error('Failed to add:', error);
    }
  };

  return (
    <div>
      <h2>Allowlist Manager</h2>

      <p>Status: {isAllowlistOnly ? 'Allowlist Only' : 'Public Minting'}</p>
      <p>You are: {isAllowed ? '✓ Allowlisted' : '✗ Not on allowlist'}</p>

      <input
        placeholder="Address to add"
        value={newAddress}
        onChange={(e) => setNewAddress(e.target.value)}
      />
      <button
        onClick={handleAdd}
        disabled={addToAllowlist.isPending}
      >
        {addToAllowlist.isPending ? 'Adding...' : 'Add to Allowlist'}
      </button>
    </div>
  );
}

// ============================================================================
// SETUP ALLOWLIST (COMBINED)
// ============================================================================

/**
 * Setup allowlist with enable option in one transaction
 */
export function SetupAllowlist({ collectionAddress }: { collectionAddress: string }) {
  const { setupAllowlist, isLoading } = useSetupAllowlist();

  const [addresses, setAddresses] = React.useState('');
  const [enableOnly, setEnableOnly] = React.useState(true);

  const handleSetup = async () => {
    try {
      await setupAllowlist({
        collectionAddress,
        addresses: addresses.split(',').map(a => a.trim()),
        enableAllowlistOnly: enableOnly,
      });
      console.log('Allowlist setup complete');
    } catch (error) {
      console.error('Setup failed:', error);
    }
  };

  return (
    <div>
      <h2>Setup Allowlist</h2>
      <textarea
        placeholder="Addresses (comma separated)"
        value={addresses}
        onChange={(e) => setAddresses(e.target.value)}
      />
      <label>
        <input
          type="checkbox"
          checked={enableOnly}
          onChange={(e) => setEnableOnly(e.target.checked)}
        />
        Enable allowlist-only mode
      </label>
      <button
        onClick={handleSetup}
        disabled={isLoading}
      >
        {isLoading ? 'Setting up...' : 'Setup Allowlist'}
      </button>
    </div>
  );
}

// ============================================================================
// OWNER MINT
// ============================================================================

/**
 * Mint NFTs as collection owner (bypass restrictions)
 */
export function OwnerMint({ collectionAddress }: { collectionAddress: string }) {
  const { ownerMint, isLoading } = useOwnerMint();
  const { address } = useWallet();

  const [recipient, setRecipient] = React.useState('');
  const [amount, setAmount] = React.useState(1);

  const handleOwnerMint = async () => {
    try {
      await ownerMint({
        collectionAddress,
        recipient: recipient || address!,
        amount,
      });
      console.log(`Owner minted ${amount} NFTs`);
    } catch (error) {
      console.error('Owner mint failed:', error);
    }
  };

  return (
    <div>
      <h2>Owner Mint</h2>
      <input
        placeholder="Recipient"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
      />
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        min={1}
      />
      <button
        onClick={handleOwnerMint}
        disabled={isLoading}
      >
        {isLoading ? 'Minting...' : `Owner Mint (${amount} NFTs)`}
      </button>
    </div>
  );
}

// ============================================================================
// GET CREATED COLLECTIONS
// ============================================================================

/**
 * Display all collections created by an address
 */
export function CreatedCollectionsList({ creator }: { creator: string }) {
  const { data, isLoading } = useCreatedCollections({ creator });

  if (isLoading) return <div>Loading collections...</div>;
  if (!data || data.length === 0) return <p>No collections found</p>;

  return (
    <div>
      <h2>Created Collections ({data.length})</h2>
      <ul>
        {data.map((collection) => (
          <li key={collection.address}>
            <strong>{collection.type}</strong>: {collection.address}
            <br />
            <small>Block: {collection.blockNumber}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// COMPLETE COLLECTION DASHBOARD
// ============================================================================

/**
 * Complete dashboard for collection management
 */
export function CollectionDashboard({ collectionAddress }: { collectionAddress: string }) {
  const { data: info, isLoading: infoLoading } = useCollectionInfo(collectionAddress);
  const { address } = useWallet();
  const { data: tokens } = useUserOwnedTokens(collectionAddress, address!);
  const { data: isAllowlisted } = useIsInAllowlist(collectionAddress, address!);
  const { data: isAllowlistOnly } = useIsAllowlistOnly(collectionAddress);
  const { createERC721 } = useCollection();
  const { mintERC721 } = useCollection();
  const { ownerMint } = useOwnerMint();

  if (infoLoading) return <div>Loading dashboard...</div>;

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h1>Collection Dashboard</h1>

      {/* Collection Info */}
      <section style={{ marginBottom: '20px' }}>
        <h2>{info?.name || 'Unknown Collection'}</h2>
        <p>Symbol: {info?.symbol}</p>
        <p>Type: {info?.tokenType}</p>
        <p>Supply: {info?.totalSupply} / {info?.maxSupply}</p>
        <p>Mint Price: {info?.mintPrice} ETH</p>
      </section>

      {/* User Status */}
      <section style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3>Your Status</h3>
        <p>Owned Tokens: {tokens?.length || 0}</p>
        <p>Allowlisted: {isAllowlisted ? '✓ Yes' : '✗ No'}</p>
        <p>Allowlist Only Mode: {isAllowlistOnly ? '✓ Enabled' : '✗ Disabled'}</p>
      </section>

      {/* Actions */}
      <section>
        <h3>Actions</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => mintERC721.mutateAsync({ collectionAddress, recipient: address!, value: info?.mintPrice || '0.1' })}
            disabled={mintERC721.isPending}
          >
            Mint NFT
          </button>

          <button
            onClick={() => ownerMint({ collectionAddress, recipient: address!, amount: 1 })}
            disabled={ownerMint.isLoading}
          >
            Owner Mint
          </button>
        </div>
      </section>
    </div>
  );
}

// ============================================================================
// EXPORT EXAMPLES
// ============================================================================

export const examples = {
  CreateCollectionExample,
  MintNFTExample,
  BatchMintExample,
  CollectionInfoDisplay,
  UserTokensDisplay,
  AllowlistManager,
  SetupAllowlist,
  OwnerMint,
  CreatedCollectionsList,
  CollectionDashboard,
};
