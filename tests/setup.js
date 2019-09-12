require('jsdom-global')();
global.expect = require('expect');
// Temporary bug fix, should be removed after vue-test-utils fixes #936
// @see https://github.com/JeffreyWay/laravel-mix/issues/1748#issuecomment-416782967
if (window) window.Date = Date;

const diff = require('jest-diff');

const noop = () => {
};

expect.extend({
  toEmit(wrapper, expected, fn = noop) {
    if (!Array.isArray(expected)) {
      expected = [expected];
    }

    // Verify events are emitted in the correct order.
    const emitted = expect(wrapper.emittedByOrder(/^futurelink|preload/, true));
    if (this.isNot) {
      emitted.not.toEqual(expected);
    }
    else {
      emitted.toEqual(expected);
    }

    let pass = true;
    const results = {};
    return expected.reduce((promise, eventName) => {
      const args = [eventName].concat(wrapper.emitted(eventName).pop());
      return promise
        .then(() => fn.apply(wrapper, args))
        .then((result) => {
          results[eventName] = result === undefined || result === null ? true : !!result;
        });
    }, Promise.resolve()).then(() => {
      if (Object.values(results).filter((r) => r !== true).length) {
        pass = false;
      }
      return {
        pass
      }
    });
  },
  toLog(received, type, expected) {
    if (typeof received === 'function') {
      received = received();
    }

    const options = {
      isNot: this.isNot,
      promise: this.promise,
    };
    const item = [].concat(global.caughtConsole[type].pop()).shift();
    const actual = item instanceof Error ? item.message : item;
    const pass = actual === expected;
    const message = pass
      ? () =>
        this.utils.matcherHint('toLog', 'function', 'type, expected', options) +
        '\n\n' +
        `Expected: ${this.utils.printExpected(expected)}\n` +
        `Received: ${this.utils.printReceived(actual)}`
      : () => {
        const diffString = diff(expected, actual, {expand: this.expand});
        return (
          this.utils.matcherHint('toLog', 'function', 'type, expected', options) +
          '\n\n' +
          (diffString && diffString.includes('- Expect')
            ? `Difference:\n\n${diffString}`
            : `Expected: ${this.utils.printExpected(expected)}\n` +
            `Received: ${this.utils.printReceived(actual)}`)
        );
      };
    return {actual, message, pass};
  },
});

global.expect = expect;
