<template>
  <div class="futurelink no-futurelink" style="height: 0; max-height: 0; overflow: hidden" aria-hidden="true">
    <div style="height: 100vh; overflow: auto;">
      <component v-if="preloadComponent" :is="preloadComponent"></component>
    </div>
  </div>
</template>

<script>
  import futurelink from 'futurelink';

  export default {
    beforeCreate() {
      // Ensure vue-router is actually being used (not just dependend on).
      if (!this.$router || !this.$route) {
        throw new Error('vue-futurelink requires vue-router to function.');
      }
    },
    data() {
      return {
        basePath: this.$router.options.base ? this.$router.options.base : '/',
        preloaded: new Set(),
        preloadComponent: undefined,
        instance: undefined,
        options: {
          future: this.preloadLink,
          links: [],
        },
      }
    },
    destroyed() {
      if (this.instance) {
        this.instance.teardown();
      }
    },
    methods: {
      logError(error) {
        // Do not show if there is no error, console or configured to be silent.
        if (!error || !('console' in window) || !('error' in window.console) || this.$options._base.config.silent) {
          return;
        }
        window.console.error(error);
      },
      async shouldPreload(path, route) {
        // Immediately return if preload meta isn't a function.
        if (typeof route.meta.preload !== 'function') {
          return route.meta.preload;
        }
        // Return any caught error; preloading is meant to be passive and it
        // needs to be logged for potential debugging purposes.
        try {
          return route.meta.preload.call(this, path, route);
        }
        catch (error) {
          return error;
        }
      },
      preloadLink(link) {
        const path = link.getAttribute('href').replace(this.basePath, '/');

        // Immediately return if this path has already been preloaded.
        if (this.preloaded.has(path)) {
          return;
        }

        // Path hasn't been handled, indicate that it now has been.
        this.preloaded.add(path);

        const resolved = this.$router.resolve(path);
        const matched = resolved.resolved.matched;
        const route = matched[matched.length - 1];
        if (!route) {
          return;
        }

        // Check whether the path/route should be preloaded.
        return this.shouldPreload(path, route)
            .then((result) => {
              // If result is an error, throw it so that it's caught below.
              if (result instanceof Error) {
                throw result;
              }
              // Do not preload if the result is explicitly set as false.
              if (result === false) {
                return;
              }
              this.$emit('preload', path, route);
              this.preloadComponent = route.components.default;
            })
            // Catch any rejections and log them so it doesn't bubble up;
            // preloading is meant to be passive.
            .catch((error) => this.logError(error));
      }
    },
    mounted() {
      // Only run in the browser, but not on mobile (no cursor).
      if (typeof window === 'undefined' || 'ontouchstart' in window) {
        return;
      }
      this.instance = futurelink(this.options);
    },
    watch: {
      // Ensure that anytime a route changes, their paths are recorded as
      // "preloaded" since this means the router is/has handled loading them.
      // This is to ensure route redirections work properly. Also, update the
      // links found on the page.
      '$route'(to, from) {
        this.preloaded.add(from.path);
        this.preloaded.add(to.path);
        this.$nextTick(() => {
          this.options.links = Array.from(document.querySelectorAll(`a[href^="${this.basePath}"`));
        });
      }
    }
  };
</script>
