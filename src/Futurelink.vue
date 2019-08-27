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
      preloadLink(link) {
        const href = link.getAttribute('href').replace(this.basePath, '/');

        // Immediately return if this route has already been preloaded.
        if (this.preloaded.has(href)) {
          return;
        }

        // Route hasn't been preloaded, indicate that is has
        this.preloaded.add(href);

        const resolved = this.$router.resolve(href);
        const matched = resolved.resolved.matched;
        const route = matched[matched.length - 1];
        if (!route) {
          return;
        }

        // Create a promise to check if the route should be preloaded.
        const shouldPreload = () => new Promise((resolve) => {
          if (typeof route.meta.preload === 'function') {
            try {
              return resolve(route.meta.preload.call(this, href, route));
            }
                // Silence any errors; preloading is meant to be passive.
            catch (e) {
              return resolve(e);
            }
          }
          resolve(route.meta.preload);
        });

        return shouldPreload()
            .then((result) => {
              // Do nothing if the result is an Error or explicitly set as false.
              if (result instanceof Error || result === false) {
                return;
              }
              this.$emit('preload', href, route);
              this.preloadComponent = route.components.default;
            })
            // Silence any rejections; preloading is meant to be passive.
            .catch(() => {});
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
