/**
 * Tests for wagmi connector helpers
 *
 * The underlying wagmi/connectors entry pulls heavy ESM dependencies that are
 * costly to load in jsdom, so we mock the connector factories and assert on
 * the call arguments + which factories the helper invokes.
 */

jest.mock('wagmi/connectors', () => ({
  injected: jest.fn(() => ({ type: 'injected' })),
  walletConnect: jest.fn((opts: unknown) => ({ type: 'walletConnect', opts })),
  coinbaseWallet: jest.fn((opts: unknown) => ({ type: 'coinbaseWallet', opts })),
}));

jest.mock('../../../react/utils/browser', () => ({
  isBrowser: jest.fn(() => true),
}));

import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';
import { isBrowser } from '../../../react/utils/browser';
import {
  createDefaultConnectors,
  createSSRSafeConnectors,
} from '../../../react/utils/connectors';

const injectedMock = injected as jest.MockedFunction<typeof injected>;
const walletConnectMock = walletConnect as jest.MockedFunction<typeof walletConnect>;
const coinbaseMock = coinbaseWallet as jest.MockedFunction<typeof coinbaseWallet>;
const isBrowserMock = isBrowser as jest.MockedFunction<typeof isBrowser>;

beforeEach(() => {
  injectedMock.mockClear();
  walletConnectMock.mockClear();
  coinbaseMock.mockClear();
  isBrowserMock.mockReset();
  isBrowserMock.mockReturnValue(true);
});

describe('createDefaultConnectors', () => {
  it('includes injected and coinbase by default and skips walletConnect without a projectId', () => {
    const connectors = createDefaultConnectors();
    expect(connectors).toHaveLength(2);
    expect(injectedMock).toHaveBeenCalledTimes(1);
    expect(coinbaseMock).toHaveBeenCalledWith({ appName: 'Zuno Marketplace' });
    expect(walletConnectMock).not.toHaveBeenCalled();
  });

  it('uses a custom appName for coinbaseWallet', () => {
    createDefaultConnectors({ appName: 'My App' });
    expect(coinbaseMock).toHaveBeenCalledWith({ appName: 'My App' });
  });

  it('adds walletConnect when projectId is provided', () => {
    const connectors = createDefaultConnectors({
      walletConnectProjectId: 'wc-test',
    });
    expect(connectors).toHaveLength(3);
    expect(walletConnectMock).toHaveBeenCalledWith({
      projectId: 'wc-test',
      showQrModal: true,
    });
  });

  it('respects explicit includeWalletConnect=false even with a projectId', () => {
    const connectors = createDefaultConnectors({
      walletConnectProjectId: 'wc-test',
      includeWalletConnect: false,
    });
    expect(connectors).toHaveLength(2);
    expect(walletConnectMock).not.toHaveBeenCalled();
  });

  it('omits injected and coinbase when explicitly disabled', () => {
    const connectors = createDefaultConnectors({
      includeInjected: false,
      includeCoinbaseWallet: false,
    });
    expect(connectors).toHaveLength(0);
    expect(injectedMock).not.toHaveBeenCalled();
    expect(coinbaseMock).not.toHaveBeenCalled();
  });

  it('skips walletConnect when includeWalletConnect=true but projectId is missing', () => {
    const connectors = createDefaultConnectors({
      includeInjected: false,
      includeCoinbaseWallet: false,
      includeWalletConnect: true,
    });
    expect(connectors).toHaveLength(0);
    expect(walletConnectMock).not.toHaveBeenCalled();
  });
});

describe('createSSRSafeConnectors', () => {
  it('returns connectors in a browser environment', () => {
    isBrowserMock.mockReturnValue(true);
    const connectors = createSSRSafeConnectors({
      walletConnectProjectId: 'wc-test',
    });
    expect(connectors).toHaveLength(3);
  });

  it('returns an empty array on the server', () => {
    isBrowserMock.mockReturnValue(false);
    const connectors = createSSRSafeConnectors({
      walletConnectProjectId: 'wc-test',
    });
    expect(connectors).toEqual([]);
    expect(injectedMock).not.toHaveBeenCalled();
    expect(coinbaseMock).not.toHaveBeenCalled();
    expect(walletConnectMock).not.toHaveBeenCalled();
  });
});
