/**
 * TransactionManager Tests
 */

import { TransactionManager } from '../../utils/transactions';
import { ZunoSDKError } from '../../utils/errors';
import { transactionStore } from '../../utils/transactionStore';
import { ethers } from 'ethers';

// Mock transactionStore
jest.mock('../../utils/transactionStore', () => ({
  transactionStore: {
    add: jest.fn().mockReturnValue('tx-1'),
    update: jest.fn(),
  },
}));

// Mock logStore
jest.mock('../../utils/logStore', () => ({
  logStore: {
    add: jest.fn(),
  },
}));

describe('TransactionManager', () => {
  let mockProvider: jest.Mocked<ethers.Provider>;
  let mockSigner: jest.Mocked<ethers.Signer>;
  let txManager: TransactionManager;

  beforeEach(() => {
    mockProvider = {
      getNetwork: jest.fn().mockResolvedValue({ chainId: 11155111n }),
      getFeeData: jest.fn().mockResolvedValue({
        gasPrice: 1000000000n,
        maxFeePerGas: 2000000000n,
        maxPriorityFeePerGas: 1000000000n,
      }),
      getTransactionCount: jest.fn().mockResolvedValue(5),
      waitForTransaction: jest.fn().mockResolvedValue({
        status: 1,
        transactionHash: '0x123',
        blockNumber: 12345,
        gasUsed: 21000n,
      }),
    } as unknown as jest.Mocked<ethers.Provider>;

    mockSigner = {
      getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
    } as unknown as jest.Mocked<ethers.Signer>;

    txManager = new TransactionManager(mockProvider, mockSigner);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create TransactionManager with provider only', () => {
      const manager = new TransactionManager(mockProvider);
      expect(manager).toBeDefined();
    });

    it('should create TransactionManager with provider and signer', () => {
      const manager = new TransactionManager(mockProvider, mockSigner);
      expect(manager).toBeDefined();
    });
  });

  describe('sendTransaction', () => {
    it('should throw error if no signer', async () => {
      const manager = new TransactionManager(mockProvider);
      const mockContract = {} as ethers.Contract;

      await expect(
        manager.sendTransaction(mockContract, 'test', [])
      ).rejects.toThrow(ZunoSDKError);
    });

    it('should throw error if method not found', async () => {
      const mockContract = {
        connect: jest.fn().mockReturnValue({
          nonExistentMethod: undefined,
        }),
      } as unknown as ethers.Contract;

      await expect(
        txManager.sendTransaction(mockContract, 'nonExistentMethod', [])
      ).rejects.toThrow('Method nonExistentMethod not found on contract');
    });

    it('should send transaction and track in store', async () => {
      const mockTx = {
        hash: '0xabc123',
        wait: jest.fn().mockResolvedValue({
          status: 1,
          hash: '0xabc123',
          blockNumber: 12345,
          gasUsed: 21000n,
        }),
      };

      const mockMethod = jest.fn().mockResolvedValue(mockTx) as jest.Mock & {
        estimateGas: jest.Mock;
      };
      mockMethod.estimateGas = jest.fn().mockResolvedValue(21000n);

      const mockContract = {
        connect: jest.fn().mockReturnValue({
          testMethod: mockMethod,
        }),
      } as unknown as ethers.Contract;

      const result = await txManager.sendTransaction(
        mockContract,
        'testMethod',
        ['arg1', 'arg2'],
        { module: 'TestModule' }
      );

      expect(mockMethod).toHaveBeenCalled();
      expect(transactionStore.add).toHaveBeenCalledWith(
        expect.objectContaining({
          hash: '0xabc123',
          action: 'testMethod',
          module: 'TestModule',
          status: 'pending',
        })
      );
      expect(result).toBeDefined();
    });

    it('should call onSent callback when transaction is sent', async () => {
      const mockTx = {
        hash: '0xabc123',
        wait: jest.fn().mockResolvedValue({
          status: 1,
          hash: '0xabc123',
          blockNumber: 12345,
          gasUsed: 21000n,
        }),
      };

      const mockMethod = jest.fn().mockResolvedValue(mockTx) as jest.Mock & {
        estimateGas: jest.Mock;
      };
      mockMethod.estimateGas = jest.fn().mockResolvedValue(21000n);

      const mockContract = {
        connect: jest.fn().mockReturnValue({
          testMethod: mockMethod,
        }),
      } as unknown as ethers.Contract;

      const onSent = jest.fn();

      await txManager.sendTransaction(mockContract, 'testMethod', [], { onSent });

      expect(onSent).toHaveBeenCalledWith('0xabc123');
    });

    it('should call onSuccess callback when transaction succeeds', async () => {
      const mockReceipt = {
        status: 1,
        hash: '0xabc123',
        blockNumber: 12345,
        gasUsed: 21000n,
      };

      const mockTx = {
        hash: '0xabc123',
        wait: jest.fn().mockResolvedValue(mockReceipt),
      };

      const mockMethod = jest.fn().mockResolvedValue(mockTx) as jest.Mock & {
        estimateGas: jest.Mock;
      };
      mockMethod.estimateGas = jest.fn().mockResolvedValue(21000n);

      const mockContract = {
        connect: jest.fn().mockReturnValue({
          testMethod: mockMethod,
        }),
      } as unknown as ethers.Contract;

      const onSuccess = jest.fn();

      await txManager.sendTransaction(mockContract, 'testMethod', [], { onSuccess });

      expect(onSuccess).toHaveBeenCalled();
    });
  });

  describe('callContract', () => {
    it('should execute read-only call', async () => {
      const mockContract = {
        balanceOf: jest.fn().mockResolvedValue(1000n),
      } as unknown as ethers.Contract;

      const result = await txManager.callContract<bigint>(
        mockContract,
        'balanceOf',
        ['0x1234567890123456789012345678901234567890']
      );

      expect(result).toBe(1000n);
      expect(mockContract.balanceOf).toHaveBeenCalledWith(
        '0x1234567890123456789012345678901234567890'
      );
    });

    it('should throw error if method not found', async () => {
      const mockContract = {
        balanceOf: undefined,
      } as unknown as ethers.Contract;

      await expect(
        txManager.callContract(mockContract, 'balanceOf', [])
      ).rejects.toThrow('Method balanceOf not found on contract');
    });

    it('should wrap errors in ZunoSDKError', async () => {
      const mockContract = {
        testMethod: jest.fn().mockRejectedValue(new Error('Call failed')),
      } as unknown as ethers.Contract;

      await expect(
        txManager.callContract(mockContract, 'testMethod', [])
      ).rejects.toThrow(ZunoSDKError);
    });
  });

  describe('getGasPrice', () => {
    it('should return current gas price', async () => {
      const gasPrice = await txManager.getGasPrice();

      expect(gasPrice).toBe(1000000000n);
      expect(mockProvider.getFeeData).toHaveBeenCalled();
    });

    it('should return 0 if gas price not available', async () => {
      mockProvider.getFeeData.mockResolvedValue({
        gasPrice: null,
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
        toJSON: () => ({}),
      } as any);

      const gasPrice = await txManager.getGasPrice();

      expect(gasPrice).toBe(0n);
    });

    it('should wrap errors in ZunoSDKError', async () => {
      mockProvider.getFeeData.mockRejectedValue(new Error('Network error'));

      await expect(txManager.getGasPrice()).rejects.toThrow(ZunoSDKError);
    });
  });

  describe('getNonce', () => {
    it('should return current nonce for address', async () => {
      const nonce = await txManager.getNonce(
        '0x1234567890123456789012345678901234567890'
      );

      expect(nonce).toBe(5);
      expect(mockProvider.getTransactionCount).toHaveBeenCalledWith(
        '0x1234567890123456789012345678901234567890',
        'pending'
      );
    });

    it('should wrap errors in ZunoSDKError', async () => {
      mockProvider.getTransactionCount.mockRejectedValue(new Error('Network error'));

      await expect(
        txManager.getNonce('0x1234567890123456789012345678901234567890')
      ).rejects.toThrow(ZunoSDKError);
    });
  });

  describe('waitForTransaction', () => {
    it('should wait for transaction confirmation', async () => {
      const receipt = await txManager.waitForTransaction('0x123', 1);

      expect(receipt).toBeDefined();
      expect(mockProvider.waitForTransaction).toHaveBeenCalledWith('0x123', 1);
    });

    it('should throw error if transaction not found', async () => {
      mockProvider.waitForTransaction.mockResolvedValue(null);

      await expect(txManager.waitForTransaction('0x123')).rejects.toThrow(
        'Transaction not found'
      );
    });

    it('should throw error if transaction reverted', async () => {
      mockProvider.waitForTransaction.mockResolvedValue({
        status: 0,
        hash: '0x123',
        blockNumber: 12345,
      } as any);

      await expect(txManager.waitForTransaction('0x123')).rejects.toThrow(
        'Transaction was reverted'
      );
    });

    it('should use default confirmations of 1', async () => {
      await txManager.waitForTransaction('0x123');

      expect(mockProvider.waitForTransaction).toHaveBeenCalledWith('0x123', 1);
    });
  });

  describe('error handling', () => {
    it('should not retry on insufficient funds error', async () => {
      const mockMethod = jest.fn().mockRejectedValue(new Error('insufficient funds')) as jest.Mock & {
        estimateGas: jest.Mock;
      };
      mockMethod.estimateGas = jest.fn().mockResolvedValue(21000n);

      const mockContract = {
        connect: jest.fn().mockReturnValue({
          testMethod: mockMethod,
        }),
      } as unknown as ethers.Contract;

      await expect(
        txManager.sendTransaction(mockContract, 'testMethod', [], { maxRetries: 3 })
      ).rejects.toThrow();

      // Should only be called once (no retries)
      expect(mockMethod).toHaveBeenCalledTimes(1);
    });

    it('should not retry on user rejected error', async () => {
      const mockMethod = jest.fn().mockRejectedValue(new Error('user rejected')) as jest.Mock & {
        estimateGas: jest.Mock;
      };
      mockMethod.estimateGas = jest.fn().mockResolvedValue(21000n);

      const mockContract = {
        connect: jest.fn().mockReturnValue({
          testMethod: mockMethod,
        }),
      } as unknown as ethers.Contract;

      await expect(
        txManager.sendTransaction(mockContract, 'testMethod', [], { maxRetries: 3 })
      ).rejects.toThrow();

      expect(mockMethod).toHaveBeenCalledTimes(1);
    });

    it('should not retry on execution reverted error', async () => {
      const mockMethod = jest.fn().mockRejectedValue(new Error('execution reverted')) as jest.Mock & {
        estimateGas: jest.Mock;
      };
      mockMethod.estimateGas = jest.fn().mockResolvedValue(21000n);

      const mockContract = {
        connect: jest.fn().mockReturnValue({
          testMethod: mockMethod,
        }),
      } as unknown as ethers.Contract;

      await expect(
        txManager.sendTransaction(mockContract, 'testMethod', [], { maxRetries: 3 })
      ).rejects.toThrow();

      expect(mockMethod).toHaveBeenCalledTimes(1);
    });
  });
});
