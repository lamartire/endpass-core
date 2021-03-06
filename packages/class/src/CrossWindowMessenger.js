const MESSAGE_TYPE = 'endpass-cw-msgr';
const ALL_METHODS = `-${MESSAGE_TYPE}-all-methods`;

const privateMethods = {
  onReceiveMessage: Symbol('onReceiveMessage'),
  sendOutside: Symbol('sendOutside'),
  onAction: Symbol('onAction'),
  offAction: Symbol('offAction'),
  isSkippedMessage: Symbol('isSkippedMessage'),
  createAnswer: Symbol('createAnswer'),
  log: Symbol('log'),
};

export default class CrossWindowMessenger {
  /**
   * @param {string} props.to To direction of send messages
   * @param {string} props.from From direction of receive messages
   * @param {Window} [props.target] target object for messages
   * @param {string} [props.name] name of current messenger
   * @param {boolean} [props.showLogs] show logs for debug
   * @param {object} [props.bus] bus for events
   */
  constructor(props = {}) {
    if (!props.to || !props.from) {
      throw new Error('You must provide direction property');
    }

    if (props.to === props.from) {
      throw new Error('Directions must be not equal');
    }

    this.name = props.name;
    this.target = props.target;
    this.directionFrom = `${MESSAGE_TYPE}-${props.from}`;
    this.directionTo = `${MESSAGE_TYPE}-${props.to}`;
    this.showLogs = props.showLogs;
    this.actions = [];

    this[privateMethods.onReceiveMessage] = this[
      privateMethods.onReceiveMessage
    ].bind(this);

    this.bus = props.bus || window;

    this.bus.addEventListener('message', this[privateMethods.onReceiveMessage]);
  }

  [privateMethods.log](...args) {
    if (this.showLogs) {
      // eslint-disable-next-line
      console.log.apply(console, [this.name, ...args]);
    }
  }

  /**
   *
   * @param {Event} ev
   * @return {boolean}
   */
  [privateMethods.isSkippedMessage](ev) {
    const { data, source } = ev;
    return (
      !data ||
      data.messageType !== MESSAGE_TYPE ||
      data.to !== this.directionFrom ||
      (this.target && this.target !== this.bus && this.target !== source)
    );
  }

  /**
   *
   * @param {Window} source
   * @param {object} data
   * @return {Function}
   */
  [privateMethods.createAnswer]({ source, data }) {
    const { from, to, method, meta = {} } = data;
    return result => {
      if (meta.isAnswer) {
        return;
      }

      this[privateMethods.sendOutside]({
        target: source,
        method,
        to: from,
        from: to,
        payload: result,
        meta: {
          ...meta,
          isAnswer: true,
        },
      });
    };
  }

  /**
   * Receive event from other window and prepare answer
   * @param {Event} ev Event from window.postMessage emitter
   */
  [privateMethods.onReceiveMessage](ev) {
    if (this[privateMethods.isSkippedMessage](ev)) {
      return;
    }

    const { source, data } = ev;
    const { payload, method } = data;

    this[privateMethods.log](
      '-- CrossWindowMessenger.onReceiveMessage()',
      data,
    );

    const req = {
      source,
      method,
      answer: this[privateMethods.createAnswer](ev),
    };

    this.actions.forEach(action => {
      const { method: actionMethod, cb } = action;
      if (actionMethod === method || actionMethod === ALL_METHODS) {
        cb(payload, req);
      }
    });
  }

  /**
   * Send message to target
   * @param {string} props.to To direction of send messages
   * @param {string} props.from From direction of receive messages
   * @param {Window} props.target target object for messages
   * @param {string} props.method method what method need to be call
   * @param {object} [props.payload] payload send data
   */
  [privateMethods.sendOutside](props) {
    if (this.showLogs) {
      // eslint-disable-next-line
      this[privateMethods.log]('-- CrossWindowMessenger().sendOutside', props);
    }

    if (!props.target) {
      throw new Error('You must provide message target!');
    }

    if (!props.to) {
      throw new Error('You must provide "to" destination');
    }

    if (!props.from) {
      throw new Error('You must provide "from" destination');
    }

    if (!props.method) {
      throw new Error('You must provide "method"');
    }

    props.target.postMessage(
      {
        messageType: MESSAGE_TYPE,
        to: props.to,
        from: props.from,
        method: props.method,
        payload: props.payload,
        meta: {
          ...props.meta,
        },
      },
      '*',
    );
  }

  /**
   * Bind actions for process messages from outside
   * @param {String|Array} method for bind actions
   * @param {Function} cb callback
   */
  [privateMethods.onAction](method, cb) {
    const methodList = [].concat(method);

    methodList.forEach(item => {
      this.actions.push({
        method: item,
        cb,
      });
    });
  }

  /**
   * Off action by callback link
   * @param {Function} cb callback
   */
  [privateMethods.offAction](cb) {
    this.actions = this.actions.filter(action => action.cb !== cb);
  }

  /**
   * Define target for send messages
   * @param {object} target
   */
  setTarget(target) {
    this.target = target;
  }

  /**
   * Wait answer for special method
   *
   * @param {string} method method for await process
   * @param {object} [payload] send payload data
   * @returns {Promise<object>}
   */
  async sendAndWaitResponse(method, payload) {
    if (!this.target) {
      throw new Error('Target is not defined to send message!');
    }

    const result = new Promise(resolve => {
      // TODO: add timeout here ?

      const handler = (data, req) => {
        if (this.showLogs) {
          // eslint-disable-next-line
          this[privateMethods.log](
            '-- CrossWindowMessenger.sendAndWaitResponse() -> handler callback',
            data,
            req,
          );
        }
        this[privateMethods.offAction](handler);
        resolve(data);
      };
      this[privateMethods.onAction](method, handler);
    });

    this.send(method, payload);

    return result;
  }

  /**
   * Subscribe to special method for answer
   * @param {string | Function} method
   * @param {Function=} cb callback
   * @return {Function} disposer
   */
  subscribe(method, cb) {
    if (typeof method === 'function') {
      // eslint-disable-next-line
      cb = method;
      // eslint-disable-next-line
      method = ALL_METHODS;
    }
    this[privateMethods.onAction](method, cb);
    return () => this.unsubscribe(cb);
  }

  /**
   * Remove callback from method subscription
   * @param {Function} cb callback
   */
  unsubscribe(cb) {
    this[privateMethods.offAction](cb);
  }

  /**
   * Send data to target
   * @param {string} method
   * @param {object} payload
   */
  send(method, payload) {
    this[privateMethods.sendOutside]({
      target: this.target,
      to: this.directionTo,
      from: this.directionFrom,
      method,
      payload,
    });
  }

  /**
   * Destroy and clean state of messenger
   */
  destroy() {
    this.bus.removeEventListener(
      'message',
      this[privateMethods.onReceiveMessage],
    );
    this.actions.length = 0;
    this.target = null;
  }
}
