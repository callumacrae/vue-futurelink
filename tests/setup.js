import {after, before, describe} from "mocha";

require('jsdom-global')();
global.expect = require('expect');
// Temporary bug fix, should be removed after vue-test-utils fixes #936
// @see https://github.com/JeffreyWay/laravel-mix/issues/1748#issuecomment-416782967
if (window) window.Date = Date;

const noop = () => {
};

expect.extend({
  toEmit(wrapper, expected, fn = noop) {
    if (!Array.isArray(expected)) {
      expected = [expected];
    }

    // Verify events are emitted in the correct order.
    expect(wrapper.emittedByOrder('preload', true)).toEqual(expected);

    return expected.reduce((promise, eventName) => {
      return promise.then(() => {
        fn.apply(wrapper, [eventName].concat(wrapper.emitted(eventName).pop()));
      });
    }, Promise.resolve());

  },
  toLogError(fn, expected) {
    const received = typeof fn === 'function' ? fn() : fn;
    const options = {
      isNot: this.isNot,
      promise: this.promise,
    };
    const lastError = [].concat(global.caughtErrors.pop()).shift();
    const actual = lastError instanceof Error ? lastError.message : lastError;
    const pass = actual === expected;
    const message = pass
      ? () =>
        this.utils.matcherHint('toLogError', undefined, undefined, options) +
        '\n\n' +
        `Expected: ${this.utils.printExpected(expected)}\n` +
        `Received: ${this.utils.printReceived(actual)}`
      : () => {
        const diffString = diff(expected, actual, {expand: this.expand});
        return (
          this.utils.matcherHint('toLogError', undefined, undefined, options) +
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
