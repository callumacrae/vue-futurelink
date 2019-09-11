<template>
  <div>
    <router-link v-for="route in routes" v-bind:key="i" :to="route"/>
    <router-view/>
    <futurelink ref="futurelink" />
  </div>
</template>

<script>
  import Futurelink from '../../src/Futurelink.vue';

  export default {
    name: 'TestVue',
    components: {
      Futurelink
    },
    computed: {
      routes() {
        return this.$router && this.$router.options && this.$router.options.routes || [];
      }
    },
  }
</script>
