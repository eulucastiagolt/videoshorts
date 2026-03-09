# VideoShorts

A lightweight YouTube video library with lazy loading support. Transform YouTube URLs into embedded iframes with full API control.

## Features

- 🚀 **Lazy Loading** - Videos load only when visible in viewport
- 📱 **Responsive** - Configurable sizes and aspect ratios
- 🎮 **Full API Control** - Play, pause, mute, seek, and more
- 💀 **Skeleton Loading** - Smooth loading experience
- ⚡ **Lightweight** - No dependencies
- 🎨 **Customizable** - CSS classes fully customizable
- 🔌 **Library Friendly** - Compatible with SwiperJS, Slick, and other carousel/slider libraries

## Installation

### NPM
```bash
npm install videoshots
```

### CDN
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/eulucastiagolt/videoshorts@1.5.0/dist/videoshots.min.css">
<script src="https://cdn.jsdelivr.net/gh/eulucastiagolt/videoshorts@1.5.0/dist/videoshots.min.js"></script>
```

### Manual
Download the files from `dist/` folder:
- `videoshots.min.js`
- `videoshots.min.css`

## Quick Start

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="videoshots.min.css">
</head>
<body>
  <div id="videos" data-videoshort></div>

  <script src="videoshots.min.js"></script>
  <script>
    const videos = [
      'https://www.youtube.com/shorts/ZDqo7XROuwM',
      'https://www.youtube.com/watch?v=SGfb6y1j5x0'
    ];

    const player = new VideoShorts('#videos', videos);
    player.init();
  </script>
</body>
</html>
```

## Options

```js
const player = new VideoShorts(container, videos, {
  // CSS Classes
  containerClass: 'videoshort-container',
  wrapperClass: 'videoshort-wrapper',
  itemClass: 'videoshort-item',
  skeletonClass: 'videoshort-skeleton',
  overlayClass: 'videoshort-overlay',
  playButtonClass: 'videoshort-play-button',
  muteButtonClass: 'videoshort-mute-button',

  // Button Icons
  playButtonIcon: '▶',
  pauseButtonIcon: '⏸',
  muteButtonIcon: '🔇',
  unmuteButtonIcon: '🔊',

  // Lazy Loading
  lazy: true,
  lazyThreshold: 0.1,
  lazyRootMargin: '200px',

  // Size
  width: '360px',
  height: null,
  aspectRatio: '9/16',

  // YouTube Player
  autoplay: false,
  muted: false,
  loop: false,
  controls: 1,
  rel: 0,
  modestbranding: 1,

  // Insert Position (for compatibility with sliders/carousels)
  insertPositionWrapper: 'beforeend',
  insertPositionItem: 'beforeend',

  // Events
  onReady: (event, index, instance) => {},
  onStateChange: (event, index, instance) => {},
  onEnd: (event, index, instance) => {},
  onPlay: (event, index, instance) => {},
  onError: (event, index, instance) => {}
});
```

### Options Details

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `containerClass` | `string` | `'videoshort-container'` | CSS class added to the container element |
| `wrapperClass` | `string` | `'videoshort-wrapper'` | CSS class for the wrapper element |
| `itemClass` | `string` | `'videoshort-item'` | CSS class for each video item |
| `skeletonClass` | `string` | `'videoshort-skeleton'` | CSS class for skeleton loader |
| `overlayClass` | `string` | `'videoshort-overlay'` | CSS class for the overlay element |
| `playButtonClass` | `string` | `'videoshort-play-button'` | CSS class for the play/pause button |
| `muteButtonClass` | `string` | `'videoshort-mute-button'` | CSS class for the mute/unmute button |
| `playButtonIcon` | `string` | `'<svg>...</svg>'` | SVG icon for play button |
| `pauseButtonIcon` | `string` | `'<svg>...</svg>'` | SVG icon for pause button |
| `muteButtonIcon` | `string` | `'<svg>...</svg>'` | SVG icon for muted state |
| `unmuteButtonIcon` | `string` | `'<svg>...</svg>'` | SVG icon for unmuted state |
| `lazy` | `boolean` | `true` | Enable lazy loading |
| `lazyThreshold` | `number` | `0.1` | Intersection threshold (0-1) |
| `lazyRootMargin` | `string` | `'200px'` | Load videos before they enter viewport |
| `width` | `string` | `'360px'` | Width of video items |
| `height` | `string` | `null` | Fixed height (overrides aspectRatio) |
| `aspectRatio` | `string` | `'9/16'` | Aspect ratio of videos |
| `autoplay` | `boolean` | `false` | Autoplay videos when loaded |
| `muted` | `boolean` | `false` | Mute videos by default |
| `loop` | `boolean` | `false` | Loop videos |
| `controls` | `number` | `1` | Show player controls |
| `rel` | `number` | `0` | Show related videos |
| `modestbranding` | `number` | `1` | Hide YouTube logo |
| `insertPositionWrapper` | `string` | `'beforeend'` | Position to insert wrapper element in container |
| `insertPositionItem` | `string` | `'beforeend'` | Position to insert video items in wrapper |

## Methods

### Playback Control

```js
// Play all videos
player.play();

// Play specific video
player.play(0);

// Pause all videos
player.pause();

// Pause specific video
player.pause(0);

// Stop all videos
player.stop();

// Stop specific video
player.stop(0);
```

### Volume Control

```js
// Mute all videos
player.mute();

// Mute specific video
player.mute(0);

// Unmute all videos
player.unMute();

// Unmute specific video
player.unMute(0);

// Toggle mute
player.toggleMute(0);

// Set volume (0-100)
player.setVolume(50);
player.setVolume(50, 0);

// Get volume
const vol = player.getVolume(0);
```

### Seek Control

```js
// Seek to seconds
player.seekTo(30);
player.seekTo(30, 0);

// Get current time
const time = player.getCurrentTime(0);

// Get duration
const duration = player.getDuration(0);
```

### State Management

```js
// Check if video is playing
const playing = player.isPlaying(0);

// Check if video is muted
const muted = player.isMuted(0);

// Get player state
const state = player.getPlayerState(0);

// Check if video is loaded
const loaded = player.isLoaded(0);
```

### Size Control

```js
// Change size dynamically
player.setSize({
  width: '480px',
  aspectRatio: '16/9'
});
```

### Player Access

```js
// Get specific YT.Player instance
const ytPlayer = player.getPlayer(0);

// Get all YT.Player instances
const allPlayers = player.getPlayers();

// Force load a video
player.loadVideo(0);
```

### Cleanup

```js
// Destroy all players and clean up
player.destroy();
```

## Events

```js
const player = new VideoShorts('#container', videos, {
  onReady: (event, index, instance) => {
    console.log(`Video ${index} is ready`);
  },

  onStateChange: (event, index, instance) => {
    // event.data values:
    // -1: unstarted
    //  0: ended
    //  1: playing
    //  2: paused
    //  3: buffering
    //  5: video cued
    console.log(`Video ${index} state:`, event.data);
  },

  onPlay: (event, index, instance) => {
    console.log(`Video ${index} started playing`);
  },

  onEnd: (event, index, instance) => {
    console.log(`Video ${index} ended`);
  },

  onError: (event, index, instance) => {
    console.error(`Video ${index} error:`, event.data);
  }
});
```

## Supported URL Formats

```js
const videos = [
  'https://www.youtube.com/watch?v=VIDEO_ID',
  'https://youtu.be/VIDEO_ID',
  'https://www.youtube.com/shorts/VIDEO_ID',
  'https://www.youtube.com/embed/VIDEO_ID'
];
```

## Styling

### Default Theme

The included CSS provides a minimal base theme. Override with your own classes:

```js
const player = new VideoShorts('#container', videos, {
  containerClass: 'my-container',
  wrapperClass: 'my-wrapper',
  itemClass: 'my-item',
  skeletonClass: 'my-skeleton'
});
```

### Custom Skeleton

```css
.my-skeleton {
  background: linear-gradient(90deg, #e0e0e0 0%, #f0f0f0 50%, #e0e0e0 100%);
  background-size: 200% 100%;
  animation: my-skeleton-animation 1.5s ease-in-out infinite;
}

@keyframes my-skeleton-animation {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Different Aspect Ratios

```js
// YouTube Shorts (9:16)
new VideoShorts('#shorts', shortsVideos, {
  width: '280px',
  aspectRatio: '9/16'
});

// Regular Videos (16:9)
new VideoShorts('#videos', videos, {
  width: '480px',
  aspectRatio: '16/9'
});

// Square (1:1)
new VideoShorts('#square', squareVideos, {
  width: '300px',
  aspectRatio: '1/1'
});

// Fixed Height
new VideoShorts('#fixed', fixedVideos, {
  width: '100%',
  height: '400px'
});
```

## Integration with Other Libraries

VideoShorts is designed to work seamlessly with slider/carousel libraries like SwiperJS, Slick, and others.

### SwiperJS Example

```html
<!DOCTYPE html>
<html>
<head>
  <!-- Swiper CSS -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css">
  <!-- VideoShorts CSS -->
  <link rel="stylesheet" href="videoshots.min.css">
</head>
<body>
  <div class="swiper">
    <div class="swiper-wrapper" id="video-container"></div>
    <div class="swiper-pagination"></div>
    <div class="swiper-button-next"></div>
    <div class="swiper-button-prev"></div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>
  <script src="videoshots.min.js"></script>
  <script>
    const videos = [
      'https://www.youtube.com/shorts/ZDqo7XROuwM',
      'https://www.youtube.com/watch?v=SGfb6y1j5x0',
      'https://www.youtube.com/shorts/abc123'
    ];

    // Initialize VideoShorts with insert positions
    const player = new VideoShorts('#video-container', videos, {
      insertPositionWrapper: 'beforeend',
      insertPositionItem: 'beforeend'
    });

    player.init().then(() => {
      // Initialize Swiper after videos are rendered
      const swiper = new Swiper('.swiper', {
        slidesPerView: 1,
        spaceBetween: 20,
        pagination: {
          el: '.swiper-pagination',
        },
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        }
      });
    });
  </script>
</body>
</html>
```

### Insert Position Options

The `insertPosition` options control where elements are inserted in the DOM. Possible values:

| Value | Description |
|-------|-------------|
| `'beforebegin'` | Before the element itself |
| `'afterbegin'` | Just inside the element, before its first child |
| `'beforeend'` | Just inside the element, after its last child |
| `'afterend'` | After the element itself |

Use these options to control the exact placement of video elements within your slider/carousel structure.

## Build

```bash
npm run build
```

Output files in `dist/`:
- `videoshots.min.js`
- `videoshots.min.css`

## Browser Support

- Chrome 51+
- Firefox 55+
- Safari 12.1+
- Edge 15+

Requires `IntersectionObserver` API (lazy loading).

## License

MIT License - see [LICENSE](LICENSE) file.

## Author

**Lucas Tiago**

- GitHub: [@eulucastiagolt](https://github.com/eulucastiagolt)
- Repository: [videoshorts](https://github.com/eulucastiagolt/videoshorts)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
