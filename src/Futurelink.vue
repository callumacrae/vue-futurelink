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
    data: () => ({
      preloadComponent: undefined,
      instance: undefined,
      options: {
        links: [],
      },
    }),
    mounted() {
      // Don't run on the server
      if (typeof window === 'undefined') {
        return;
      }

      // Don't run on mobile
      if ('ontouchstart' in window) {
        return;
      }

      const loaded = [this.$route.path];

      this.options.future = (link) => {
        let href = link.getAttribute('href');

        if (this.$router.options.base) {
            href = href.replace(this.$router.options.base, '/')
        }

        if (loaded.includes(href)) {
          return;
        }

        loaded.push(href);

        const resolved = this.$router.resolve(href);
        const matched = resolved.resolved.matched;
        const route = matched[matched.length - 1];
        // Only preload if a route was found.
        if (route) {
          // If the route has a preload meta property, check whether the route should be preloaded.
          if ((typeof route.meta.preload === 'function' && route.meta.preload(href, route) === false) || route.meta.preload !== false) {
            return;
          }
          this.$emit('preload', href, route);
          this.preloadComponent = route.components.default;
        }
      };

      this.instance = futurelink(this.options);

      this.init();
      this.$router.afterEach(() => this.init());
    },
    destroyed() {
      if (this.instance) {
        this.instance.teardown();
      }
    },
    methods: {
      init() {
        this.$nextTick(() => {
          this.options.links = Array.from(document.querySelectorAll('a[href^="/"'));
        });
      },
    },
  };
</script>
