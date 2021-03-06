import SubscriptionMixin from '@/provider/mixins/SubscriptionMixin';
import BaseProvider from 'fixtures/BaseProvider';
import { BLOCK_UPDATE_INTERVAL_MSEC } from '@/constants';

jest.useFakeTimers();

describe('SubscriptionProvider class', () => {
  const callback = jest.fn();
  let provider;
  let SubscriptionProvider;

  beforeEach(() => {
    SubscriptionProvider = SubscriptionMixin(BaseProvider);
    provider = new SubscriptionProvider();

    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  it('should return correct class', () => {
    expect(provider).toBeInstanceOf(BaseProvider);
  });

  describe('on', () => {
    it('should verify callback type', () => {
      expect(() => provider.on()).toThrow(
        'The second parameter callback must be a function.',
      );
      expect(() => provider.on('data', callback)).not.toThrow();
    });

    it('should add callback', () => {
      provider.on('error', callback);
      expect(provider.notificationCallbacks.error).toEqual(callback);

      provider.on('data', callback);
      expect(provider.notificationCallbacks.data).toContainEqual(callback);
    });
  });

  describe('removeListener', () => {
    const errorHandler = jest.fn();

    beforeEach(() => {
      provider.notificationCallbacks.data = [callback];
      provider.notificationCallbacks.error = errorHandler;
    });

    it('should not remove listeners', () => {
      provider.removeListener();

      expect(provider.notificationCallbacks.data).toContainEqual(callback);
      expect(provider.notificationCallbacks.error).toEqual(errorHandler);
    });

    describe('data', () => {
      it('should not remove listener', () => {
        provider.removeListener('error');
        expect(provider.notificationCallbacks.data).toContainEqual(callback);

        provider.removeListener('data', () => {});
        expect(provider.notificationCallbacks.data).toContainEqual(callback);
      });

      it('should remove listener', () => {
        provider.removeListener('data', callback);

        expect(provider.notificationCallbacks.data).not.toContainEqual(
          callback,
        );
      });
    });
  });

  describe('removeAllListeners', () => {
    const notificationCallbacks = [callback];
    const errorHandler = jest.fn();

    beforeEach(() => {
      provider.notificationCallbacks.data = [...notificationCallbacks];
      provider.notificationCallbacks.error = errorHandler;
    });

    it('should not remove all listeners', () => {
      provider.removeAllListeners();

      expect(provider.notificationCallbacks.data).toEqual(
        notificationCallbacks,
      );
      expect(provider.notificationCallbacks.error).toEqual(errorHandler);
    });

    describe('data', () => {
      it('should not remove data listeners', () => {
        provider.removeAllListeners('error');

        expect(provider.notificationCallbacks.data).toEqual(
          notificationCallbacks,
        );
      });

      it('should remove data listeners', () => {
        provider.removeAllListeners('data');

        expect(provider.notificationCallbacks.data).toEqual([]);
      });
    });

    describe('error', () => {
      it('should not remove error listener', () => {
        provider.removeAllListeners('data');

        expect(provider.notificationCallbacks.error).toEqual(errorHandler);
      });

      it('should remove error listener', () => {
        provider.removeAllListeners('error');

        expect(provider.notificationCallbacks.error).toEqual(
          expect.any(Function),
        );
        expect(provider.notificationCallbacks.error.toString()).toBe(
          'function () {}',
        );
      });
    });
  });

  describe('reset', () => {
    it('should reset provider', () => {
      jest.spyOn(provider, 'stopPollingNewBlockHeaders');

      provider.notificationCallbacks = {
        data: [1, 2, 3],
        error: callback,
      };

      provider.reset();

      expect(provider.notificationCallbacks.data).toEqual([]);
      expect(provider.notificationCallbacks.error).not.toEqual(callback);
      expect(provider.notificationCallbacks.error).toBeInstanceOf(Function);
      expect(provider.stopPollingNewBlockHeaders).toHaveBeenCalledTimes(1);
    });
  });

  describe('sendAsync', () => {
    const subsrciptionId = Date.now();
    const subscribeType = 'newHeads';

    it('should handle suscribe method', () => {
      const payload = {
        id: 1,
        method: 'eth_subscribe',
        params: [subscribeType],
      };

      jest.spyOn(Date, 'now').mockImplementation(() => subsrciptionId);

      provider.sendAsync(payload, callback);

      Date.now.mockRestore();

      expect(provider.subsrciptionIds[subsrciptionId]).toEqual({
        type: subscribeType,
      });
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(null, {
        id: payload.id,
        result: subsrciptionId,
        jsonrpc: '2.0',
      });
    });

    it('should handle unsuscribe method', () => {
      const payload = {
        id: 1,
        method: 'eth_unsubscribe',
        params: [subsrciptionId],
      };

      provider.subsrciptionIds[subsrciptionId] = {};

      provider.sendAsync(payload, callback);

      expect(provider.subsrciptionIds[subsrciptionId]).toBeUndefined();
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(null, {
        id: payload.id,
        result: true,
        jsonrpc: '2.0',
      });
    });

    it('should call parent sendAsync method', () => {
      const payload = {
        id: 1,
        method: 'eth_call',
        params: [],
      };

      provider.sendAsync(payload, callback);

      expect(BaseProvider.prototype.sendAsync).toHaveBeenCalledTimes(1);
      expect(BaseProvider.prototype.sendAsync).toHaveBeenCalledWith(
        payload,
        callback,
      );
    });
  });

  describe('startPollingNewBlockHeaders', () => {
    const blockNumber = 1;
    const block = {
      number: blockNumber,
    };
    const getBlockNumber = jest.fn().mockResolvedValue(blockNumber);
    const getBlock = jest.fn().mockResolvedValue(block);
    const subsrciptionId = 'subsrciption id';

    it('should not start polling', () => {
      provider.startPollingNewBlockHeaders();
      expect(setInterval).toHaveBeenCalledTimes(0);

      provider.startPollingNewBlockHeaders(getBlockNumber);
      expect(setInterval).toHaveBeenCalledTimes(0);

      provider.startPollingNewBlockHeaders(null, getBlock);
      expect(setInterval).toHaveBeenCalledTimes(0);
    });

    it('should stop old polling', () => {
      provider.newBlocksIntervalId = 1;

      jest.spyOn(provider, 'stopPollingNewBlockHeaders');

      provider.startPollingNewBlockHeaders(getBlockNumber, getBlock);

      expect(provider.stopPollingNewBlockHeaders).toHaveBeenCalledTimes(1);
      expect(setInterval).toHaveBeenCalledTimes(1);
    });

    it('should have correct interval', () => {
      provider.startPollingNewBlockHeaders(getBlockNumber, getBlock);

      expect(setInterval).toHaveBeenCalledTimes(1);
      expect(setInterval).toHaveBeenCalledWith(
        expect.any(Function),
        BLOCK_UPDATE_INTERVAL_MSEC,
      );
    });

    it('should start polling and call callbacks', async () => {
      expect.assertions(2);

      provider.notificationCallbacks.data = [callback];
      provider.subsrciptionIds = {
        [subsrciptionId]: { type: 'newHeads' },
      };

      provider.startPollingNewBlockHeaders(getBlockNumber, getBlock);

      jest.runOnlyPendingTimers();

      await flushPromises();

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({
        method: 'eth_subscribe',
        params: {
          subscription: subsrciptionId,
          result: block,
        },
      });
    });

    it('should start polling and not call callbacks', async () => {
      expect.assertions(1);

      provider.notificationCallbacks.data = [callback];
      provider.subsrciptionIds = {
        [subsrciptionId]: { type: 'logs' },
      };

      provider.startPollingNewBlockHeaders(getBlockNumber, getBlock);

      jest.runOnlyPendingTimers();

      await flushPromises();

      expect(callback).toHaveBeenCalledTimes(0);
    });

    it('should not call callback if getBlock return null', async () => {
      expect.assertions(1);

      provider.notificationCallbacks.data = [callback];
      provider.subsrciptionIds = {
        [subsrciptionId]: { type: 'newHeads' },
      };

      getBlock.mockResolvedValueOnce(null);

      provider.startPollingNewBlockHeaders(getBlockNumber, getBlock);

      jest.runOnlyPendingTimers();

      await flushPromises();

      expect(callback).toHaveBeenCalledTimes(0);
    });

    it('should handle errors', async () => {
      expect.assertions(2);

      const error = new Error();

      jest.spyOn(provider.notificationCallbacks, 'error');
      global.console.error = jest.fn();
      getBlock.mockRejectedValueOnce(error);

      provider.startPollingNewBlockHeaders(getBlockNumber, getBlock);

      jest.runOnlyPendingTimers();

      await flushPromises();

      expect(provider.notificationCallbacks.error).toHaveBeenCalledTimes(1);
      expect(provider.notificationCallbacks.error).toHaveBeenCalledWith(error);
    });
  });

  describe('stopPollingNewBlockHeaders', () => {
    it('should stop polling', () => {
      const newBlocksIntervalId = 1;

      provider.newBlocksIntervalId = newBlocksIntervalId;

      provider.stopPollingNewBlockHeaders();

      expect(clearInterval).toHaveBeenCalledTimes(1);
      expect(clearInterval).toHaveBeenCalledWith(newBlocksIntervalId);
      expect(provider.newBlocksIntervalId).toBeNull();
    });
  });
});
