# futurelink

> Calculates the deceleration of the cursor to predict when a link is about to be clicked.

## Install

```
$ npm install --save futurelink
```

## Usage

```js
var futurelink = require('futurelink');

futurelink({
  links: document.querySelectorAll('a'),
  future: function (link) {
    // `link` is probably going to be clicked soon
    // Preload some images, if you can!
  },
  
  // These also exist, but aren't usually needed:
  hover: function (link) {},
  click: function (link) {}
})
```

## How does it work?

@todo (I did a little study)

## License

Released under the MIT license.