# vue-futurelink

> A vue component to preload links about to be clicked with [futurelink].

## Installation

```
$ npm install --save-dev vue-futurelink
```

## Usage

Just load the component and output it into the page, and it will do the rest: it will set up the mouse tracking, hook into vue-router, and output a hidden element to the page. Relies on vue-router.

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

I put it below the footer, but in theory it should work anywhere on the page.

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

## Source vs. Dist

By default, the `main` entry points to the compiled and minified version
of the Vue template. This is typically fine. However, in certain cases,
perhaps using a PR or forked version of this package, you may need to
import the source Vue component directly from the package. To do this,
just append the import with the path to the Vue component: 

```js
import Futurelink from 'vue-futurelink/src/Futurelink';
```

> Note: doing this requires that your build system is using
 [vue-loader](https://github.com/vuejs/vue-loader) so it can compile the
 Vue [SFC](https://github.com/vuejs/vue-loader/blob/master/docs/spec.md). 

## route.meta.preload

In some cases, actionable routes shouldn't be preloaded (i.e. `/logout`).

You can explicitly set the `preload` meta property of a route to
`false` to prevent it from being preloaded:

```js
{
  path: '/logout',
  // ...
  meta: {
    preload: false,
  },
},
```

In other cases, routes that can be resource intensive may need more
complex handling to preload additional resources not typically
associated with just mounting a vue component.

You can also supply the `preload` meta property with a callback
function. This callback is passed two parameters:

- `href` - (string) The link href value (stripped of any router base path).
- `route` - (Route) The matched route object.

To prevent the route from being preloaded, the return value of the
callback must explicitly return `false`. Optionally, a `Promise` may
be returned that can ultimately be resolved to a boolean.

Any errors or rejections encountered during the callback will be
intentionally silenced as preloading is meant to be a passive
feature.

```js
{
  path: '/process-intensive-route',
  // ...
  meta: {
    preload: (href, route) => startFetchingOtherResources(route),
  },
},
```


## License

Released under the MIT license.

[futurelink]: https://github.com/SamKnows/futurelink
