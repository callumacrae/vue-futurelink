import {createLocalVue, mount} from "@vue/test-utils";
import Vue from 'vue';
import VueRouter from 'vue-router';
import TestVue from './fixtures/TestVue.vue';

export const createComponent = (name) => {
  return Vue.component(name, {
    template: `<div class="${name}"/>`
  });
};

export const createAnchorLink = (path) => {
  const el = document.createElement('a');
  el.href = path;
  return el;
};

export const createRoute = (path, component, preload) => {
  const route = {
    path,
    components: {
      default: component,
    },
  };
  if (preload !== undefined) {
    route.meta = {preload};
  }
  return route;
};

export const createWrapper = (routerConfig) => {
  const localVue = createLocalVue();
  const options = {};
  if (routerConfig !== false) {
    localVue.use(VueRouter);
    options.localVue = localVue;
    options.router = new VueRouter(routerConfig);
  }
  const wrapper = mount(TestVue, options);

  // Provide a little fix to clone array objects so they
  // always return an array and don't get modified.
  const emitted = wrapper.emitted;
  wrapper.emitted = (...args) => [...(emitted.call(wrapper, ...args) || [])];

  const emittedByOrder = wrapper.emittedByOrder;
  wrapper.emittedByOrder = (prefix, namesOnly) => {
    let events = [...emittedByOrder.call(wrapper)];
    if (prefix) {
      events = events.filter(o => o.name.startsWith(prefix));
    }
    return namesOnly ? events.map(o => o.name) : events;
  };

  return wrapper;
};

export const silentVue = (fn) => {
  const previous = Vue.config.silent;
  Vue.config.silent = true;
  fn();
  Vue.config.silent = previous;
};

export default {
  createAnchorLink,
  createComponent,
  createRoute,
  createWrapper,
  silentVue,
};
