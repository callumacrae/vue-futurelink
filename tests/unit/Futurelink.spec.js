import futurelink from 'futurelink';
import Vue from 'vue';
import {after, before, describe, it} from "mocha";

import {
  createAnchorLink,
  createRoute,
  createWrapper,
  silentVue,
} from '../helpers';

const _global = (() => globalThis || (window !== undefined && window) || (global !== undefined && global) || (self !== undefined && self) || {})();
const _consoleError = _global.console.error;
_global.caughtErrors = [];

describe('Futurelink.vue', () => {
  before(function () {
    _global.console.error = (...args) => {
      _global.caughtErrors.push([...args]);
    }
  });
  after(function () {
    _global.console.error = _consoleError;
  });

  it('log error if vue-router is not used', () => {
    expect(() => createWrapper(false)).toLogError('[vue-futurelink] Vue.use(VueRouter) must be invoked prior to using vue-futurelink!');
  });

  it('does not log error if vue-router is not used and Vue.config.silent', () => {
    expect(() => silentVue(() => createWrapper(false))).not.toLogError('[vue-futurelink] Vue.use(VueRouter) must be invoked prior to using vue-futurelink!');
  });

  it('is a Vue instance', () => {
    const wrapper = createWrapper();
    expect(wrapper.isVueInstance()).toBeTruthy();
    expect(wrapper.vm).toBeInstanceOf(Vue);
    expect(wrapper.vm.$refs.futurelink).toBeInstanceOf(Vue);
  });

  it('creates and destroys futurelink instance', () => {
    const wrapper = createWrapper();
    expect(typeof wrapper.vm.$refs.futurelink.futurelink).toBe('function');

    const ctor = futurelink({links: []}).constructor;
    expect(wrapper.vm.$refs.futurelink.futurelink).toBeInstanceOf(ctor);

    wrapper.vm.$refs.futurelink.$destroy();
    expect(wrapper.vm.$refs.futurelink.futurelink).toBeUndefined();
  });

  it('preloadLink matches route, preloads component and emits event', () => {
    const routePath = '/foo';
    const link = createAnchorLink(routePath);
    const foo = createRoute(routePath, () => import('../fixtures/components/Foo.vue'));
    const wrapper = createWrapper({routes: [foo]});
    return wrapper.vm.$refs.futurelink.preloadLink(link)
      .then(() => {
        const expected = [
          'preload:before',
          'preload',
          'preload:mounted',
          'preload:after',
        ];
        expect(wrapper).toEmit(expected, (eventName, path, route, component) => {
          expect(path).toEqual(routePath);
          expect(route.path).toEqual(routePath);
          if (eventName === 'preload:mounted') {
            expect(component).not.toBeUndefined();
          }
          else {
            expect(component).toBeUndefined();
          }
        });
      })
  });

  it('preloadLink does not preload component or emit event', () => {
    const routePath = '/foo';
    const link = createAnchorLink(routePath);
    const foo = createRoute(routePath, () => import('../fixtures/components/Foo.vue'), false);
    const wrapper = createWrapper({routes: [foo]});
    let capturedPath;
    let capturedRoute;
    wrapper.vm.$refs.futurelink.$on('preload', (path, route) => {
      capturedPath = path;
      capturedRoute = route;
    });
    return wrapper.vm.$refs.futurelink.preloadLink(link)
      .then(() => {
        expect(capturedPath).toBeUndefined();
        expect(capturedRoute).toBeUndefined();
      })
  });

});
