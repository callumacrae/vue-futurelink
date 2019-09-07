import {shallowMount} from '@vue/test-utils'
import Futurelink from '@/Futurelink';
import {
  createComponent,
  createLink,
  createRoute,
  createWrapper
} from '../helpers';

describe('Futurelink.vue', () => {

  test('throws when not using vue-router', () => {
    expect(() => {
      const error = console.error;
      console.error = () => {
      };
      try {
        shallowMount(Futurelink)
      }
      catch (e) {
        console.error = error;
        throw e;
      }
    }).toThrowError('vue-futurelink requires vue-router to function.');
  });

  test('is a Vue instance', () => {
    const wrapper = createWrapper();
    expect(wrapper.isVueInstance()).toBeTruthy();
  });

  test('preloadLink matches route, preloads component and emits event', () => {
    const Foo = createComponent('foo');
    const foo = createRoute('/foo', Foo);
    const wrapper = createWrapper({routes: [foo]});
    const routePath = '/foo';
    const link = createLink(routePath);
    let handlerPath;
    let handlerRoute;
    wrapper.vm.$on('preload', (path, route) => {
      handlerPath = path;
      handlerRoute = route;
    });
    return wrapper.vm.preloadLink(link)
      .then(() => {
        const event = wrapper.emitted('preload');
        const [path, route] = event.pop();
        expect(path).toEqual(routePath);
        expect(route.path).toEqual(routePath);
        expect(handlerPath).toEqual(routePath);
        expect(handlerRoute.path).toEqual(routePath);
        expect(wrapper.vm.preloadComponent).toEqual(Foo)
      })
  });

  test('preloadLink does not preload component or emit event', () => {
    const Foo = createComponent('foo');
    const foo = createRoute('/foo', Foo, false);
    const wrapper = createWrapper({routes: [foo]});
    const routePath = '/foo';
    const link = createLink(routePath);
    let handlerPath;
    let handlerRoute;
    wrapper.vm.$on('preload', (path, route) => {
      handlerPath = path;
      handlerRoute = route;
    });
    return wrapper.vm.preloadLink(link)
      .then(() => {
        expect(wrapper.emitted('preload')).toBeUndefined();
        expect(handlerPath).toBeUndefined();
        expect(handlerRoute).toBeUndefined();
        expect(wrapper.vm.preloadComponent).toBeUndefined();
      })
  });

});
