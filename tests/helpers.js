import {createLocalVue, shallowMount} from "@vue/test-utils";
import Vue from 'vue';
import VueRouter from 'vue-router';
import Futurelink from '@/Futurelink';

export const createComponent = (name) => {
  return Vue.component(name, {
    template: `<div class="${name}"/>`
  });
};

export const createLink = (path) => {
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
  return shallowMount(Futurelink, options);
};

export default {
  createComponent,
  createLink,
  createRoute,
  createWrapper,
};
