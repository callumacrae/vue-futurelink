# vue-futurelink

> Preload links about to be clicked with futurelink.

## Installation

```
$ npm install --save-dev vue-futurelink
```

## Usage

Just load the component and output it into the page, and it will do the rest: it will set up the mouse tracking, hook into vue-router, and output a hidden element to the page.

I put it below the footer, but in theory it should work anywhere on the page.

```html
<template>
  <futurelink></futurelink>
</template>

<script>
  import Futurelink from 'vue-futurelink';

  export {
    components: {
      Futurelink
    }
  };
</script>
```

When a page is preloaded, a `preload` event is fired:

```html
<template>
  <futurelink v-on:preload="handlePreload"></futurelink>
</template>

<script>
  import Futurelink from 'vue-futurelink';

  export {
    methods: {
      handlePreload(path) {
        console.info(`Preloading ${path}`);
      },
    },
    components: {
      Futurelink
    }
  };
</script>
```

## License

Released under the MIT license.