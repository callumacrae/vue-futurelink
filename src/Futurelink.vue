<template>
  <div class="preload no-preload" aria-hidden="true">
    <div class="preload-inner">
      <component v-if="preloadComponent" :is="preloadComponent"></component>
    </div>
  </div>
</template>

<script>
  import futurelink from 'futurelink';

  export default {
    data: () => ({
      preloadComponent: undefined,
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
        const href = link.getAttribute('href');

        if (loaded.includes(href)) {
          return;
        }

        loaded.push(href);

        this.$emit('preload', href);

        const resolved = this.$router.resolve(href);
        const matched = resolved.resolved.matched;
        this.preloadComponent = matched[matched.length - 1].components.default;
      };

      futurelink(this.options);

      this.init();
      this.$router.afterEach(() => this.init());
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

<style scoped>
  /* display: none messes up our home page */
  .preload {
    height: 0;
    overflow: hidden;
  }
  .preload-inner {
    height: 100vh;
    overflow: auto;
  }
</style>