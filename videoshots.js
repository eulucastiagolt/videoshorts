/*!
 * VideoShorts
 * A lightweight YouTube video library with lazy loading support
 * 
 * Copyright (c) 2025 Lucas Tiago
 * Licensed under the MIT License
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * 
 * @author Lucas Tiago
 * @version 1.1.1
 * @license MIT
 * @repository https://github.com/eulucastiagolt/videoshorts
 */

(function(global) {
  'use strict';

  const VERSION = '1.1.1';
  const DEFAULT_OPTIONS = {
    containerClass: 'videoshort-container',
    wrapperClass: 'videoshort-wrapper',
    itemClass: 'videoshort-item',
    skeletonClass: 'videoshort-skeleton',
    lazy: true,
    lazyThreshold: 0.1,
    lazyRootMargin: '200px',
    width: '360px',
    height: null,
    aspectRatio: '9/16',
    autoplay: false,
    muted: false,
    loop: false,
    controls: 1,
    rel: 0,
    modestbranding: 1
  };

  let ytApiReady = false;
  let ytApiLoading = false;
  const apiCallbacks = [];

  function loadYouTubeAPI() {
    if (ytApiReady) return Promise.resolve();
    if (ytApiLoading) return new Promise(resolve => apiCallbacks.push(resolve));

    ytApiLoading = true;
    return new Promise((resolve) => {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      global.onYouTubeIframeAPIReady = function() {
        ytApiReady = true;
        ytApiLoading = false;
        apiCallbacks.forEach(cb => cb());
        resolve();
      };
    });
  }

  function extractVideoId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]+)/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  class VideoShorts {
    constructor(container, videos, options = {}) {
      this.container = typeof container === 'string' 
        ? document.querySelector(container) 
        : container;
      this.videos = videos;
      this.options = { ...DEFAULT_OPTIONS, ...options };
      this.players = [];
      this.playerStates = [];
      this.playerElements = [];
      this.observer = null;
      this.loadedVideos = new Set();
      this._containerEl = null;
      this._wrapperEl = null;
    }

    get version() {
      return VERSION;
    }

    async init() {
      this._render();
      
      if (this.options.lazy) {
        this._setupLazyLoading();
      } else {
        await loadYouTubeAPI();
        await this._createAllPlayers();
      }
      
      return this;
    }

    _getItemSizeStyles() {
      const { width, height, aspectRatio } = this.options;
      const styles = {};
      
      if (width) styles.width = width;
      if (height) {
        styles.height = height;
        styles.aspectRatio = 'unset';
      } else if (aspectRatio) {
        styles.aspectRatio = aspectRatio;
      }
      
      return styles;
    }

    _applyStyles(element, styles) {
      Object.assign(element.style, styles);
    }

    _render() {
      this._clearContainer();
      
      this._containerEl = document.createElement('div');
      this._containerEl.className = this.options.containerClass;

      this._wrapperEl = document.createElement('div');
      this._wrapperEl.className = this.options.wrapperClass;

      const itemStyles = this._getItemSizeStyles();

      this.videos.forEach((url, index) => {
        const videoId = extractVideoId(url);
        if (!videoId) return;

        const itemEl = document.createElement('div');
        itemEl.className = this.options.itemClass;
        itemEl.setAttribute('data-video-index', index);
        this._applyStyles(itemEl, itemStyles);

        if (this.options.lazy) {
          const skeleton = this._createSkeleton(index);
          itemEl.appendChild(skeleton);
        } else {
          const playerEl = document.createElement('div');
          playerEl.id = `videoshort-player-${index}`;
          itemEl.appendChild(playerEl);
        }

        this.playerElements[index] = itemEl;
        this._wrapperEl.appendChild(itemEl);
      });

      this._containerEl.appendChild(this._wrapperEl);
      this.container.appendChild(this._containerEl);
    }

    _clearContainer() {
      if (this._containerEl && this._containerEl.parentNode) {
        this._containerEl.parentNode.removeChild(this._containerEl);
      }
      this._containerEl = null;
      this._wrapperEl = null;
    }

    _createSkeleton(index) {
      const skeleton = document.createElement('div');
      skeleton.className = this.options.skeletonClass;
      skeleton.setAttribute('data-video-index', index);
      return skeleton;
    }

    _setupLazyLoading() {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const index = parseInt(entry.target.getAttribute('data-video-index'));
              if (!this.loadedVideos.has(index)) {
                this._loadVideo(index);
              }
            }
          });
        },
        {
          root: null,
          rootMargin: this.options.lazyRootMargin,
          threshold: this.options.lazyThreshold
        }
      );

      this.playerElements.forEach((el, index) => {
        if (el) {
          const skeleton = el.querySelector(`[data-video-index="${index}"]`);
          if (skeleton) {
            this.observer.observe(skeleton);
          }
        }
      });
    }

    async _loadVideo(index) {
      const itemEl = this.playerElements[index];
      if (!itemEl) return;

      const skeleton = itemEl.querySelector(`.${this.options.skeletonClass}`);
      const videoId = extractVideoId(this.videos[index]);
      
      if (!videoId) return;

      this.loadedVideos.add(index);

      await loadYouTubeAPI();

      const playerEl = document.createElement('div');
      playerEl.id = `videoshort-player-${index}`;

      if (skeleton) {
        skeleton.replaceWith(playerEl);
      } else {
        itemEl.appendChild(playerEl);
      }

      await this._createPlayer(index, videoId);
    }

    async _createAllPlayers() {
      const promises = [];
      
      this.videos.forEach((url, index) => {
        const videoId = extractVideoId(url);
        if (!videoId) return;
        
        this.loadedVideos.add(index);
        promises.push(this._createPlayer(index, videoId));
      });

      await Promise.all(promises);
    }

    _createPlayer(index, videoId) {
      return new Promise((resolve) => {
        const playerEl = document.getElementById(`videoshort-player-${index}`);
        if (!playerEl) {
          resolve();
          return;
        }

        const player = new YT.Player(`videoshort-player-${index}`, {
          videoId: videoId,
          playerVars: {
            autoplay: this.options.autoplay ? 1 : 0,
            mute: this.options.muted ? 1 : 0,
            loop: this.options.loop ? 1 : 0,
            controls: this.options.controls,
            rel: this.options.rel,
            modestbranding: this.options.modestbranding,
            playsinline: 1,
            enablejsapi: 1
          },
          events: {
            onReady: (event) => {
              this.playerStates[index] = {
                muted: this.options.muted,
                playing: false
              };
              
              if (this.options.onReady) {
                this.options.onReady(event, index, this);
              }
              resolve();
            },
            onStateChange: (event) => {
              this.playerStates[index] = this.playerStates[index] || {};
              this.playerStates[index].playing = event.data === YT.PlayerState.PLAYING;
              
              if (this.options.onStateChange) {
                this.options.onStateChange(event, index, this);
              }
            },
            onError: (event) => {
              if (this.options.onError) {
                this.options.onError(event, index, this);
              }
              resolve();
            }
          }
        });

        this.players[index] = player;
      });
    }

    async loadVideo(index) {
      if (!this.loadedVideos.has(index)) {
        await this._loadVideo(index);
      }
      return this;
    }

    isLoaded(index) {
      return this.loadedVideos.has(index);
    }

    setSize(options) {
      if (options.width) this.options.width = options.width;
      if (options.height) this.options.height = options.height;
      if (options.aspectRatio) this.options.aspectRatio = options.aspectRatio;
      
      const itemStyles = this._getItemSizeStyles();
      this.playerElements.forEach(el => {
        if (el) this._applyStyles(el, itemStyles);
      });
      
      return this;
    }

    play(index) {
      if (index !== undefined) {
        if (this.players[index]) {
          this.players[index].playVideo();
        } else if (!this.loadedVideos.has(index)) {
          this._loadVideo(index).then(() => {
            setTimeout(() => this.players[index]?.playVideo(), 100);
          });
        }
      } else {
        this.players.forEach(player => player && player.playVideo());
      }
      return this;
    }

    pause(index) {
      if (index !== undefined && this.players[index]) {
        this.players[index].pauseVideo();
      } else {
        this.players.forEach(player => player && player.pauseVideo());
      }
      return this;
    }

    stop(index) {
      if (index !== undefined && this.players[index]) {
        this.players[index].stopVideo();
      } else {
        this.players.forEach(player => player && player.stopVideo());
      }
      return this;
    }

    mute(index) {
      if (index !== undefined && this.players[index]) {
        this.players[index].mute();
        if (this.playerStates[index]) this.playerStates[index].muted = true;
      } else {
        this.players.forEach((player, i) => {
          if (player) {
            player.mute();
            if (this.playerStates[i]) this.playerStates[i].muted = true;
          }
        });
      }
      return this;
    }

    unMute(index) {
      if (index !== undefined && this.players[index]) {
        this.players[index].unMute();
        if (this.playerStates[index]) this.playerStates[index].muted = false;
      } else {
        this.players.forEach((player, i) => {
          if (player) {
            player.unMute();
            if (this.playerStates[i]) this.playerStates[i].muted = false;
          }
        });
      }
      return this;
    }

    toggleMute(index) {
      if (index !== undefined && this.playerStates[index]) {
        return this.playerStates[index].muted ? this.unMute(index) : this.mute(index);
      }
      return this;
    }

    setVolume(volume, index) {
      const vol = Math.max(0, Math.min(100, volume));
      if (index !== undefined && this.players[index]) {
        this.players[index].setVolume(vol);
      } else {
        this.players.forEach(player => player && player.setVolume(vol));
      }
      return this;
    }

    getVolume(index) {
      if (index !== undefined && this.players[index]) {
        return this.players[index].getVolume();
      }
      return null;
    }

    seekTo(seconds, index) {
      if (index !== undefined && this.players[index]) {
        this.players[index].seekTo(seconds, true);
      } else {
        this.players.forEach(player => player && player.seekTo(seconds, true));
      }
      return this;
    }

    getCurrentTime(index) {
      if (index !== undefined && this.players[index]) {
        return this.players[index].getCurrentTime();
      }
      return null;
    }

    getDuration(index) {
      if (index !== undefined && this.players[index]) {
        return this.players[index].getDuration();
      }
      return null;
    }

    getPlayerState(index) {
      if (index !== undefined && this.players[index]) {
        return this.players[index].getPlayerState();
      }
      return null;
    }

    isMuted(index) {
      if (index !== undefined && this.playerStates[index]) {
        return this.playerStates[index].muted;
      }
      return null;
    }

    isPlaying(index) {
      if (index !== undefined && this.playerStates[index]) {
        return this.playerStates[index].playing;
      }
      return null;
    }

    getPlayer(index) {
      return this.players[index] || null;
    }

getPlayers() {
      return this.players.filter(p => p);
    }

    destroy() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
      this.players.forEach(player => player && player.destroy());
      this.players = [];
      this.playerStates = [];
      this.playerElements = [];
      this.loadedVideos.clear();
      this._clearContainer();
      return this;
    }
  }

  VideoShorts.version = VERSION;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = VideoShorts;
  } else {
    global.VideoShorts = VideoShorts;
  }

})(typeof window !== 'undefined' ? window : this);
