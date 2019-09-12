import futurelink from 'futurelink';
import Vue from 'vue';
import {after, before, beforeEach, describe, it} from "mocha";

import {
  createAnchorLink,
  createRoute,
  createWrapper,
  mobileVue,
  silentVue,
} from '../helpers';

const _global = (() => globalThis || (window !== undefined && window) || (global !== undefined && global) || (self !== undefined && self) || {})();
const _console = new Map();

describe('Futurelink.vue', () => {
  before(function () {
    ['debug', 'info', 'error', 'log', 'warn'].forEach(type => {
      _console.set(type, _global.console[type]);
      _global.console[type] = (...args) => {
        _global.caughtConsole[type].push([...args]);
      }
    });
  });
  beforeEach(function () {
    _global.caughtConsole = {debug: [], info: [], error: [], log: [], warn: []};
  });
  after(function () {
    // Restore console.
    _console.forEach((fn, type) => {
      _global.console[type] = fn;
    });
  });

  it('created - logs error if vue-router is not used', () => {
    expect(() => createWrapper(false)).toLog('error', '[vue-futurelink] Vue.use(VueRouter) must be invoked prior to using vue-futurelink!');
  });

  it('created - logs warning if attempting to initialize on mobile device', () => {
    expect(() => mobileVue(() => createWrapper())).toLog('warn', '[vue-futurelink] Unable to initialize on mobile device (no cursor).');
  });

  it('created - does not log error if vue-router is not used (Vue.config.silent)', () => {
    expect(() => silentVue(() => createWrapper(false))).not.toLog('error', '[vue-futurelink] Vue.use(VueRouter) must be invoked prior to using vue-futurelink!');
  });

  it('created - does not log warning if attempting to initialize on mobile device (Vue.config.silent)', () => {
    expect(() => mobileVue(() => silentVue(() => createWrapper()))).not.toLog('warn', '[vue-futurelink] Unable to initialize on mobile device (no cursor).');
  });

  it('created - vue instance', () => {
    const wrapper = createWrapper();
    expect(wrapper.isVueInstance()).toBeTruthy();
    expect(wrapper.vm).toBeInstanceOf(Vue);
    expect(wrapper.vm.$refs.futurelink).toBeInstanceOf(Vue);
  });

  it('created/destroyed - futurelink instance', () => {
    const wrapper = createWrapper();
    expect(typeof wrapper.vm.$refs.futurelink.futurelink).toBe('function');

    const ctor = futurelink({links: []}).constructor;
    expect(wrapper.vm.$refs.futurelink.futurelink).toBeInstanceOf(ctor);

    wrapper.vm.$refs.futurelink.$destroy();
    expect(wrapper.vm.$refs.futurelink.futurelink).toBeUndefined();
  });

  it('#onFuture - emits "futurelink[:*]" events', () => {
    const path = '/foo';
    const link = createAnchorLink(path);
    const foo = createRoute(path, () => import('../fixtures/components/Foo.vue'));
    const wrapper = createWrapper({routes: [foo]});
    return wrapper.vm.$refs.futurelink.onFuture(link)
      .then(() => {
        const expected = [
          'futurelink:before',
          'futurelink',
          'futurelink:mounted',
          'futurelink:after',
        ];
        return expect(wrapper).toEmit(expected, (eventName, emittedRoute) => {
          expect(emittedRoute).toMatchObject(foo);
          expect(emittedRoute.meta.futurelink.trigger).toStrictEqual(link);
          if (eventName === 'futurelink:mounted') {
            expect(emittedRoute.mountedComponent).not.toBeUndefined();
            expect(emittedRoute.$component).toBeInstanceOf(Vue);
          }
          else {
            expect(emittedRoute.mountedComponent).toBeUndefined();
            expect(emittedRoute.$component).toBeUndefined();
          }
        });
      })
  });

  it('#onFuture - emits deprecated "preload" event', () => {
    const path = '/foo';
    const link = createAnchorLink(path);
    const foo = createRoute(path, () => import('../fixtures/components/Foo.vue'));
    const wrapper = createWrapper({routes: [foo]});

    // Capture deprecated BC "preload" event arguments.
    let emittedPath, emittedRoute;
    wrapper.vm.$refs.futurelink.$on('preload', (path, route) => {
      emittedPath = path;
      emittedRoute = route;
    });

    return wrapper.vm.$refs.futurelink.onFuture(link)
      .then(() => {
        expect().toLog('warn', '[vue-futurelink] The "preload" event name has been deprecated in 2.0.0 and will be removed in 3.0.0. Bind using the "futurelink" event name instead.');
        expect(emittedPath).toBe(path);
        expect(emittedRoute).toMatchObject(foo);
        expect(emittedRoute.mountedComponent).toBeUndefined();
        expect(emittedRoute.$component).toBeUndefined();
      })
  });

  it('#onFuture - does not emit "futurelink[:*]" events', () => {
    const path = '/foo';
    const link = createAnchorLink(path);
    const foo = createRoute(path, () => import('../fixtures/components/Foo.vue'), false);
    const wrapper = createWrapper({routes: [foo]});
    return wrapper.vm.$refs.futurelink.onFuture(link)
      .then(() => {
        const expected = [
          'futurelink:before',
          'futurelink',
          'futurelink:mounted',
          'futurelink:after',
        ];
        expect(wrapper).not.toEmit(expected);
      })
  });

  it('#onFuture - does not emit deprecated "preload" event', () => {
    const path = '/foo';
    const link = createAnchorLink(path);
    const foo = createRoute(path, () => import('../fixtures/components/Foo.vue'), false);
    const wrapper = createWrapper({routes: [foo]});

    // Capture deprecated BC "preload" event arguments.
    let emittedPath, emittedRoute;
    wrapper.vm.$refs.futurelink.$on('preload', (path, route) => {
      emittedPath = path;
      emittedRoute = route;
    });

    return wrapper.vm.$refs.futurelink.onFuture(link)
      .then(() => {
        expect().not.toLog('warn', '[vue-futurelink] The "preload" event name has been deprecated in 2.0.0 and will be removed in 3.0.0. Bind using the "futurelink" event name instead.');
        // Check deprecated "preload" arguments.
        expect(emittedPath).toBeUndefined();
        expect(emittedRoute).toBeUndefined();
      })
  });

});
