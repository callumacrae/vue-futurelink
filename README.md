# vue-futurelink

> Preload links about to be clicked with futurelink.

## Installation

```js
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

## License

Released under the MIT license.