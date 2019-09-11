<template>
  <div class="futurelink no-futurelink" style="height: 0; max-height: 0; overflow: hidden;" aria-hidden="true">
    <div class="futurelink-component" v-if="mountedComponent" style="height: 100vh; overflow: auto;">
      <component :is="mountedComponent"></component>
    </div>
  </div>
</template>

<script>
  import Vue from 'vue';
  import futurelink from 'futurelink';
  import VueRouter from 'vue-router';
  import {name as pkgName} from '../package.json';

  /* istanbul ignore next */
  const _global = (() => globalThis || (window !== undefined && window) || (global !== undefined && global) || (self !== undefined && self) || {})();

  /* istanbul ignore next */
  function config() {
    return {...Vue.config, ...(this && this.$options && this.$options._base && this.$options._base.config && this.$options._base.config || {})};
  }

  function isSilent() {
    return !!config.call(this).silent;
  }

  function bubbleEmit(eventName, ...args) {
    // Emit the event on all parent components
    let component = this;
    do {
      component.$emit(eventName, ...args);
      component = component.$parent;
    } while (component);
  }

  function logError(error) {
    // Do not log error if there is no arguments, console.error is undefined, or configured to be silent.
    if (!error || !('console' in _global) || !('error' in _global.console) || isSilent.call(this)) {
      return;
    }
    if (!(error instanceof Error)) {
      error = new Error(error);
    }
    _global.console.error(error);
  }

  function resolveComponent(value, rejectMessage = 'Invalid component.') {
    return Promise.resolve(typeof value === 'function' ? value() : value)
        .then((component) => component && component.__esModule && component.default || component)
        .then((component) => {
          if (component && (
              // Component instance.
              component instanceof Vue

              // Component constructor.
              || (typeof component === 'object'
                  && typeof component._Ctor === 'object'
                  && Vue.prototype.isPrototypeOf(component._Ctor[Object.keys(component._Ctor).shift()].prototype)
              )

              // Compiled Vue SFC
              || (typeof component.render === 'function' && Array.isArray(component.staticRenderFns))
          )) {
            return component;
          }
          throw new Error(rejectMessage);
        })
  }

  export default {
    beforeCreate() {
      // Ensure vue-router is actually being used (not just depended on).
      if (!this.$router || !(this.$router instanceof VueRouter)) {
        logError(`[${pkgName}] Vue.use(VueRouter) must be invoked prior to using ${pkgName}!`);
      }
    },
    beforeDestroy() {
      // The current version of futurelink returns the private "teardown" function upon initiation.
      // @todo Revisit this if/when futurelink moves to a class based instance modal.
      if (typeof this.futurelink === 'function') {
        this.futurelink();
        this.futurelink = undefined;
      }
    },
    data() {
      const routerOptions = Object.assign({}, this.$router && this.$router.options);
      return {
        basePath: routerOptions.base || '/',
        futurelink: undefined,
        mountedComponent: undefined,
        preloaded: new Map(),
        options: {
          future: this.preloadLink,
          links: [],
        },
      }
    },
    methods: {
      preloadLink(link) {
        const path = link.getAttribute('href').replace(this.basePath, '/');

        // Immediately return if this path has already been preloaded.
        if (this.preloaded.has(path)) {
          return bubbleEmit.call(this, 'preload:existed', path, this.preloaded.get(path));
        }

        // Resolve the route by matching the path.
        const resolved = this.$router.resolve(path);
        const matched = resolved.resolved.matched;
        const route = matched[matched.length - 1];

        // Path hasn't been handled, indicate that it has been now.
        this.preloaded.set(path, route);

        // Determine whether the path/route should be preloaded.
        return this.shouldPreload(path, route)
            .then(() => {
              bubbleEmit.call(this, 'preload:before', path, route);
              bubbleEmit.call(this, 'preload', path, route);
            })
            .then(() => this.shouldMount(path, route))
            .then(() => {
              bubbleEmit.call(this, 'preload:after', path, route)
            })
            // Catch any rejections and log them so it doesn't bubble up;
            // preloading is meant to be passive.
            .catch((error) => logError.call(this, error));
      },
      shouldMount(path, route) {
        return resolveComponent(route.components.default, 'Route must specify a "component" or "components.default" value.')
            .then((component) => {
              // Immediately return if there is no component to mount, component isn't
              // a Vue instance or the route meta property was explicitly set to false.
              if (!component || route.meta.preloadMount === false) {
                return;
              }
              this.mountedComponent = component;
              bubbleEmit.call(this, 'preload:mounted', path, route, component)
            })
            // Catch any rejections and log them so it doesn't bubble up;
            // preloading is meant to be passive.
            .catch((error) => logError.call(this, error));
      },
      shouldPreload(path, route) {
        // Immediately return if there is no path or route to resolve.
        if (!path || !route) {
          return Promise.reject(false);
        }
        const promise = new Promise((resolve) => {
          // Immediately return if preload meta isn't a function.
          if (typeof route.meta.preload !== 'function') {
            return resolve(route.meta.preload);
          }
          // Return any caught error; preloading is meant to be passive and it
          // needs to be logged for potential debugging purposes.
          try {
            return resolve(route.meta.preload.call(this, path, route));
          }
          catch (error) {
            resolve(error);
          }
        });

        // If result is an error or false, throw it so that it
        // breaks the promise chain and catches it below.
        return promise.then((result) => {
          if (result instanceof Error || result === false) {
            throw result;
          }
          return result;
        });
      },
      updateLinks() {
        this.$nextTick(() => {
          this.options.links = Array.from(document.querySelectorAll(`a[href^="${this.basePath}"`));
        });
      }
    },
    mounted() {
      // Only run when vue-router is used and in the browser, but not on mobile (no cursor).
      if (!this.$router || !(this.$router instanceof VueRouter) || 'ontouchstart' in _global) {
        return;
      }
      this.updateLinks();
      this.futurelink = futurelink(this.options);
    },
    watch: {
      // Ensure that anytime a route changes, their paths are recorded as
      // "preloaded" since this means the router is/has handled loading them.
      // This is to ensure route redirection works properly. Also, update the
      // links found on the page.
      '$route'(to, from) {
        this.preloaded.set(from.path, from);
        this.preloaded.set(to.path, to);
        this.updateLinks();
      }
    }
  };
</script>
