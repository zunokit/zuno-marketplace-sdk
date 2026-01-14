/**
 * Wallet Connection Examples
 *
 * This file demonstrates various wallet connection patterns using the Zuno Marketplace SDK
 *
 * @module examples/basics/wallet-connection
 */

import { ethers } from 'ethers';
import { ZunoSDK } from 'zuno-marketplace-sdk';

// ============================================================================
// BROWSER WALLET CONNECTION (MetaMask, WalletConnect, etc.)
// ============================================================================

/**
 * Connect to browser wallet (MetaMask, Coinbase Wallet, etc.)
 */
export async function connectBrowserWallet() {
  // Check if window.ethereum exists
  if (!window.ethereum) {
    throw new Error('No wallet found. Please install MetaMask or another Web3 wallet.');
  }

  // Create provider from window.ethereum
  const provider = new ethers.BrowserProvider(window.ethereum);

  // Request account access
  await provider.send('eth_requestAccounts', []);

  // Get signer
  const signer = await provider.getSigner();

  // Get address
  const address = await signer.getAddress();

  console.log('Connected to wallet:', address);

  // Initialize SDK with signer
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
    provider,
    signer,
  });

  return { sdk, address, signer };
}

// ============================================================================
// WALLET CONNECTION WITH ACCOUNT SWITCHING
// ============================================================================

/**
 * Connect to wallet and handle account switching
 */
export async function connectWithAccountSwitching() {
  if (!window.ethereum) {
    throw new Error('No wallet found');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  let signer = await provider.getSigner();
  let address = await signer.getAddress();

  console.log('Initial address:', address);

  // Listen for account changes
  window.ethereum.on('accountsChanged', async (accounts: string[]) => {
    console.log('Account changed:', accounts[0]);

    // Update signer with new account
    signer = await provider.getSigner();
    address = await signer.getAddress();

    // Reinitialize SDK with new signer
    const sdk = new ZunoSDK({
      apiKey: process.env.ZUNO_API_KEY!,
      network: 'sepolia',
      provider,
      signer,
    });

    console.log('SDK updated with new account');
  });

  return { provider, signer, address };
}

// ============================================================================
// WALLET CONNECTION WITH NETWORK SWITCHING
// ============================================================================

/**
 * Connect to wallet and handle network changes
 */
export async function connectWithNetworkSwitching() {
  if (!window.ethereum) {
    throw new Error('No wallet found');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  // Get current network
  const network = await provider.getNetwork();
  console.log('Current network:', network.name);

  // Listen for network changes
  window.ethereum.on('chainChanged', (chainId: string) => {
    console.log('Network changed:', chainId);

    // Reload page to reset state (recommended approach)
    window.location.reload();
  });

  return { provider, signer, address, network };
}

// ============================================================================
// REQUEST NETWORK SWITCH
// ============================================================================

/**
 * Request user to switch to a specific network
 */
export async function switchNetwork(targetChainId: string) {
  if (!window.ethereum) {
    throw new Error('No wallet found');
  }

  try {
    // Try to switch to the network
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: targetChainId }],
    });
    console.log('Switched to network:', targetChainId);
  } catch (error: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (error.code === 4902) {
      console.log('Network not found in wallet. Please add it manually.');
    }
    throw error;
  }
}

// ============================================================================
// GET WALLET BALANCE
// ============================================================================

/**
 * Get ETH balance of connected wallet
 */
export async function getWalletBalance(address: string, provider: ethers.Provider) {
  const balance = await provider.getBalance(address);
  const balanceInEth = ethers.formatEther(balance);

  console.log('Wallet balance:', balanceInEth, 'ETH');
  return balanceInEth;
}

// ============================================================================
// CHECK WALLET CONNECTION STATUS
// ============================================================================

/**
 * Check if wallet is connected
 */
export async function isWalletConnected() {
  if (!window.ethereum) {
    return false;
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_accounts',
    });

    return accounts.length > 0;
  } catch {
    return false;
  }
}

// ============================================================================
// DISCONNECT WALLET (Note: Most wallets don't support programmatic disconnect)
// ============================================================================

/**
 * Clear wallet connection from app state
 * Note: This only clears your app's state, not the wallet's connection
 */
export function disconnectWallet() {
  // Clear any stored wallet state
  localStorage.removeItem('walletAddress');
  localStorage.removeItem('walletConnected');

  // Trigger UI update
  window.dispatchEvent(new CustomEvent('walletDisconnected'));

  console.log('Wallet disconnected from app state');
}

// ============================================================================
// RECONNECT ON PAGE LOAD
// ============================================================================

/**
 * Reconnect to wallet on page load
 */
export async function reconnectOnLoad() {
  const wasConnected = localStorage.getItem('walletConnected');

  if (wasConnected && window.ethereum) {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_accounts', []);

      if (accounts.length > 0) {
        const signer = await provider.getSigner();
        const address = await signer.getAddress();

        const sdk = new ZunoSDK({
          apiKey: process.env.ZUNO_API_KEY!,
          network: 'sepolia',
          provider,
          signer,
        });

        console.log('Reconnected to wallet:', address);
        return { sdk, address, signer };
      }
    } catch (error) {
      console.error('Failed to reconnect:', error);
    }
  }

  return null;
}

// ============================================================================
// MULTIPLE WALLET SUPPORT
// ============================================================================

/**
 * Detect and connect to available wallets
 */
export async function detectWallets() {
  if (!window.ethereum) {
    console.log('No wallet detected');
    return null;
  }

  // Check for specific wallet providers
  const isMetaMask = !!(window.ethereum as any).isMetaMask;
  const isCoinbase = !!(window.ethereum as any).isCoinbaseWallet;
  const isTrust = !!(window.ethereum as any).isTrust;

  console.log('Detected wallets:', {
    metaMask: isMetaMask,
    coinbase: isCoinbase,
    trust: isTrust,
  });

  // Connect to the first available wallet
  return connectBrowserWallet();
}

// ============================================================================
// WALLET CONNECTION ERROR HANDLING
// ============================================================================

/**
 * Handle common wallet connection errors
 */
export async function connectWithErrorHandling() {
  try {
    if (!window.ethereum) {
      throw new Error('No wallet found. Please install a Web3 wallet.');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);

    // Request account access with timeout
    const signer = await Promise.race([
      provider.getSigner(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout')), 10000)
      ),
    ]);

    const address = await signer.getAddress();

    const sdk = new ZunoSDK({
      apiKey: process.env.ZUNO_API_KEY!,
      network: 'sepolia',
      provider,
      signer,
    });

    return { sdk, address, signer };
  } catch (error: any) {
    // Handle specific error codes
    if (error.code === 4001) {
      // User rejected the request
      throw new Error('Connection rejected by user');
    } else if (error.code === -32002) {
      // Request already pending
      throw new Error('Please check your wallet for pending requests');
    } else {
      throw error;
    }
  }
}

// ============================================================================
// RUN EXAMPLE
// ============================================================================

/**
 * Run all wallet connection examples
 */
export async function runWalletConnectionExamples() {
  console.log('=== Check Wallet Connection ===');
  const isConnected = await isWalletConnected();
  console.log('Wallet connected:', isConnected);

  if (!isConnected) {
    console.log('\n=== Connect Wallet ===');
    try {
      const result = await connectBrowserWallet();
      console.log('Connected:', result.address);
    } catch (error: any) {
      console.error('Connection failed:', error.message);
    }
  }
}

// Run if executed directly
if (require.main === module) {
  // Note: These examples require a browser environment with window.ethereum
  console.log('Wallet connection examples require a browser environment');
  console.log('Please use these in a web application with Web3 wallet support');
}
