<template>
  <div class="futurelink no-futurelink" style="height: 0; max-height: 0; overflow: hidden;" aria-hidden="true">
    <div class="futurelink-component" v-if="mountedComponent" style="height: 100vh; overflow: auto;">
      <component :is="mountedComponent" ref="mountedComponent"></component>
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

  function resolveComponent(value) {
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
        })
  }

  export default {
    beforeDestroy() {
      // The current version of futurelink returns the private "teardown" function upon initiation.
      // @todo Revisit this if/when futurelink moves to a class based instance modal.
      if (typeof this.futurelink === 'function') {
        this.futurelink();
        this.futurelink = undefined;
      }
    },
    created() {
      // Ensure vue-router is actually being used (not just depended on).
      if (!this.$router || !(this.$router instanceof VueRouter)) {
        return this.$error(`[${pkgName}] Vue.use(VueRouter) must be invoked prior to using ${pkgName}!`);
      }

      // Don't initialize on mobile.
      if ('ontouchstart' in _global) {
        return this.$warn(`[${pkgName}] Unable to initialize on mobile device (no cursor).`);
      }

      this.updateLinks();
      this.futurelink = futurelink(this.options);
    },
    data() {
      const routerOptions = Object.assign({}, this.$router && this.$router.options);
      return {
        basePath: routerOptions.base || '/',
        futurelink: undefined,
        mountedComponent: undefined,
        preloaded: new Set(),
        options: {
          future: this.onFuture,
          links: [],
        },
      }
    },
    computed: {
      /* istanbul ignore next */
      config() {
        return {...Vue.config, ...(this && this.$options && this.$options._base && this.$options._base.config && this.$options._base.config || {})};
      }
    },
    methods: {
      $bubbleEmit(eventName, ...args) {
        let component = this;
        do {
          component.$emit(eventName, ...args);
          component = component.$parent;
        } while (component);
      },
      $log(type, ...args) {
        // Do not log error if there is no arguments, console.error is undefined, or configured to be silent.
        if (!args.length || !('console' in _global) || !(type in _global.console) || this.config.silent) {
          return;
        }
        _global.console[type](...args);
      },
      $error(error) {
        this.$log('error', error instanceof Error ? error : new Error(error))
      },
      $warn(message) {
        this.$log('warn', message)
      },
      onFuture(trigger) {
        const route = this.resolveRoute(trigger);

        // Immediately return if unable to resolve route.
        if (!route) {
          return Promise.resolve();
        }

        // Immediately return if this path has already been preloaded.
        if (this.preloaded.has(route.path)) {
          return Promise.resolve().then(() => this.$bubbleEmit('futurelink:preloaded', route));
        }

        // Path hasn't been handled, indicate that it has been now.
        this.preloaded.add(route.path);

        // Determine whether the path/route should be preloaded.
        return this.shouldPreload(route)
            .then(() => {
              this.$bubbleEmit('futurelink:before', route);
              this.$bubbleEmit('futurelink', route);

              // Check whether there is an attached listener or manually
              // registered listener to support the "preload" event.
              // @todo Deprecated, remove in 3.0.0.
              if ((this.$listeners && 'preload' in this.$listeners) || (this._events && 'preload' in this._events)) {
                this.$warn(`[${pkgName}] The "preload" event name has been deprecated in 2.0.0 and will be removed in 3.0.0. Bind using the "futurelink" event name instead.`);
                const path = trigger.getAttribute('href').replace(this.basePath, '/');
                this.$emit('preload', path, route);
              }
            })
            .then(() => this.shouldMount(route))
            .then(() => {
              this.$bubbleEmit('futurelink:after', route)
            })
            // Catch any rejections and log them so it doesn't bubble up;
            // preloading is meant to be passive.
            .catch((error) => this.$error(error));
      },
      resolveRoute(trigger) {
        const path = trigger.getAttribute('href').replace(this.basePath, '/');

        // Resolve the route by matching the path.
        const resolved = this.$router.resolve(path);
        const matched = resolved.resolved.matched;
        if (!matched.length) {
          return;
        }
        const route = {...matched[matched.length - 1]};

        // Normalize the "futurelink" meta property.
        const meta = Object.assign({}, route.meta);

        // Allow a callback to return a value.
        if (typeof meta.futurelink === 'function') {
          meta.futurelink = meta.futurelink();
        }

        let mount = true;
        let preload = true;

        // Explicitly disabled.
        if (meta.futurelink === false) {
          mount = preload = false;
        }
        else if (typeof meta.futurelink === 'object') {
          mount = meta.futurelink.mount === undefined ? true : meta.futurelink.mount;
          preload = meta.futurelink.preload === undefined ? true : meta.futurelink.preload;
        }

        route.meta = {
          ...meta,
          futurelink: {
            mount,
            preload,
            trigger
          }
        };

        return route;
      },
      shouldMount(route) {
        this.mountedComponent = undefined;

        // Immediately return if route component shouldn't be mounted.
        if (route.meta.futurelink.mount === false) {
          return;
        }

        return resolveComponent(route.components.default)
            .then((component) => {
              // Attempt to mound the component.
              this.mountedComponent = component;

              // Indicate an error if the component could not be mounted.
              if (!this.mountedComponent || !(this.$refs.mountedComponent instanceof Vue)) {
                throw new Error('A route must specify a "component" or "components.default" value for it to be preloaded.');
              }

              // Emit a mounted event.
              this.$bubbleEmit('futurelink:mounted', {
                ...route,
                $component: this.$refs.mountedComponent,
                mountedComponent: component,
              });
            })
            // Catch any rejections and log them so it doesn't bubble up;
            // preloading is meant to be passive.
            .catch((error) => this.$error(error));
      },
      shouldPreload(route) {
        // Immediately return if there is no route to resolve.
        if (!route) {
          return Promise.reject(false);
        }
        const promise = new Promise((resolve) => {
          // Immediately return if preload meta isn't a function.
          if (typeof route.meta.futurelink.preload !== 'function') {
            return resolve(route.meta.futurelink.preload);
          }
          // Return any caught error; preloading is meant to be passive and it
          // needs to be logged for potential debugging purposes.
          try {
            return resolve(route.meta.futurelink.preload.call(this, route));
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
    watch: {
      // Ensure that anytime a route changes, their paths are recorded as
      // "preloaded" since this means the router is/has handled loading them.
      // This is to ensure route redirection works properly. Also, update the
      // links found on the page.
      '$route'(to, from) {
        this.preloaded.add(from.path);
        this.preloaded.add(to.path);
        this.updateLinks();
      }
    }
  };
</script>
