/*!
 * VideoShorts
 * A lightweight YouTube video library with lazy loading support
 *
 * Copyright (c) 2026 Lucas Tiago
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
 * @version 1.6.8
 * @license MIT
 * @repository https://github.com/eulucastiagolt/videoshorts
 */

(function (global) {
  "use strict";

  const VERSION = "1.6.8";
  const DEFAULT_OPTIONS = {
    containerClass: "videoshort-container",
    wrapperClass: "videoshort-wrapper",
    itemClass: "videoshort-item",
    skeletonClass: "videoshort-skeleton",
    overlayClass: "videoshort-overlay",
    playButtonClass: "videoshort-play-button",
    playButtonIcon:
      '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    pauseButtonIcon:
      '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>',
    muteButtonClass: "videoshort-mute-button",
    muteButtonIcon:
      '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>',
    unmuteButtonIcon:
      '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>',
    showThumbnail: true,
    thumbnailClass: "videoshort-thumbnail",
    thumbnailTransitionDuration: "0.3s",
    showThumbnailOnPause: false,
    thumbnailFallbackIcon:
      '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
    lazy: true,
    lazyThreshold: 0.1,
    lazyRootMargin: "200px",
    width: "360px",
    height: null,
    aspectRatio: "9/16",
    autoplay: false,
    muted: false,
    loop: false,
    controls: 1,
    rel: 0,
    modestbranding: 1,
    insertPositionWrapper: "beforeend",
    insertPositionItem: "beforeend",
    onReady: null,
    onStateChange: null,
    onEnd: null,
    onPlay: null,
    onError: null,
  };

  let ytApiReady = false;
  let ytApiLoading = false;
  const apiCallbacks = [];

  function loadYouTubeAPI() {
    if (ytApiReady) return Promise.resolve();
    if (ytApiLoading)
      return new Promise((resolve) => apiCallbacks.push(resolve));

    ytApiLoading = true;
    return new Promise((resolve) => {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      global.onYouTubeIframeAPIReady = function () {
        ytApiReady = true;
        ytApiLoading = false;
        apiCallbacks.forEach((cb) => cb());
        resolve();
      };
    });
  }

  function extractVideoId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]+)/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  class VideoShorts {
    static _instanceId = 0;

    constructor(container, videos, options = {}) {
      this.container =
        typeof container === "string"
          ? document.querySelector(container)
          : container;
      this.videos = videos;
      this.options = { ...DEFAULT_OPTIONS, ...options };
      this._instanceId = VideoShorts._instanceId++;
      this.players = [];
      this.playerStates = [];
      this.playerElements = [];
      this.overlayElements = [];
      this.playButtons = [];
      this.muteButtons = [];
      this.observer = null;
      this.loadedVideos = new Set();
      this._wrapperEl = null;
      this._cueVideoState = {};
      this.thumbnailElements = [];
      this.thumbnailLoaded = new Set();
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
        styles.aspectRatio = "unset";
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

      if (this.options.containerClass) {
        this.container.classList.add(this.options.containerClass);
      }

      this._wrapperEl = document.createElement("div");
      this._wrapperEl.className = this.options.wrapperClass;

      const itemStyles = this._getItemSizeStyles();

      this.videos.forEach((url, index) => {
        const videoId = extractVideoId(url);
        if (!videoId) return;

        const itemEl = document.createElement("div");
        itemEl.className = this.options.itemClass;
        itemEl.setAttribute("data-video-index", index);
        itemEl.setAttribute("data-instance-id", this._instanceId);
        this._applyStyles(itemEl, itemStyles);

        if (this.options.lazy) {
          const skeleton = this._createSkeleton(index);
          itemEl.appendChild(skeleton);
        } else {
          const playerEl = document.createElement("div");
          playerEl.id = `videoshort-player-${this._instanceId}-${index}`;
          itemEl.appendChild(playerEl);
        }

        if (this.options.showThumbnail) {
          const thumbnail = this._createThumbnail(index);
          if (thumbnail) {
            itemEl.appendChild(thumbnail);
          }
        }

        const overlay = this._createOverlay(index);
        itemEl.appendChild(overlay);

        this.playerElements[index] = itemEl;
        this._wrapperEl.insertAdjacentElement(
          this.options.insertPositionItem,
          itemEl,
        );
      });

      this.container.insertAdjacentElement(
        this.options.insertPositionWrapper,
        this._wrapperEl,
      );

      this._setupEventDelegation();
    }

    _setupEventDelegation() {
      const instanceId = this._instanceId;
      const playButtonClass = this.options.playButtonClass;
      const muteButtonClass = this.options.muteButtonClass;
      const overlayClass = this.options.overlayClass;

      const getIndexFromElement = (el) => {
        const itemEl = el.closest(
          `[data-video-index][data-instance-id="${instanceId}"]`,
        );
        return itemEl
          ? parseInt(itemEl.getAttribute("data-video-index"), 10)
          : null;
      };

      const handleWrapperClick = (e) => {
        const target = e.target;

        const muteButton = target.closest(`.${muteButtonClass}`);
        if (muteButton) {
          e.stopPropagation();
          const index = getIndexFromElement(muteButton);
          if (index === null || isNaN(index)) return;
          this.toggleMute(index);
          this._updateMuteButton(index);
          return;
        }

        const playButton = target.closest(`.${playButtonClass}`);
        if (playButton) {
          e.stopPropagation();
          const index = getIndexFromElement(playButton);
          if (index === null || isNaN(index)) return;

          if (!this.players[index]) {
            if (!this.loadedVideos.has(index)) {
              this._loadVideo(index).then(() => {
                setTimeout(() => this._togglePlayPause(index), 100);
              });
            }
            return;
          }
          this._togglePlayPause(index);
          return;
        }

        const overlay = target.closest(`.${overlayClass}`);
        if (overlay) {
          const index = getIndexFromElement(overlay);
          if (index === null || isNaN(index)) return;

          if (!this.players[index]) {
            if (!this.loadedVideos.has(index)) {
              this._loadVideo(index).then(() => {
                setTimeout(() => this._togglePlayPause(index), 100);
              });
            }
            return;
          }
          this._togglePlayPause(index);
        }
      };

      this._wrapperEl.addEventListener("click", handleWrapperClick);
      this._boundHandleWrapperClick = handleWrapperClick;
    }

    _clearContainer() {
      if (this._mutationObserver) {
        this._mutationObserver.disconnect();
        this._mutationObserver = null;
      }
      if (this._wrapperEl && this._boundHandleWrapperClick) {
        this._wrapperEl.removeEventListener(
          "click",
          this._boundHandleWrapperClick,
        );
        this._boundHandleWrapperClick = null;
      }
      if (this._wrapperEl && this._wrapperEl.parentNode) {
        this._wrapperEl.parentNode.removeChild(this._wrapperEl);
      }
      if (this.options.containerClass) {
        this.options.containerClass.split(/\s+/).forEach(cls => {
          if (cls) this.container.classList.remove(cls);
        });
      }
      this._wrapperEl = null;
    }

    _createSkeleton(index) {
      const skeleton = document.createElement("div");
      skeleton.className = this.options.skeletonClass;
      skeleton.setAttribute("data-video-index", index);
      return skeleton;
    }

    _createOverlay(index) {
      const overlay = document.createElement("div");
      overlay.className = this.options.overlayClass;
      overlay.classList.add("videoshort-overlay-hidden");
      overlay.setAttribute("data-instance-id", this._instanceId);

      const playButton = document.createElement("button");
      playButton.className = this.options.playButtonClass;
      playButton.setAttribute("type", "button");
      playButton.setAttribute("aria-label", "Play");
      playButton.innerHTML = this.options.playButtonIcon;

      const muteButton = document.createElement("button");
      muteButton.className = this.options.muteButtonClass;
      muteButton.setAttribute("type", "button");
      muteButton.setAttribute("aria-label", "Toggle mute");
      muteButton.innerHTML = this.options.muted
        ? this.options.muteButtonIcon
        : this.options.unmuteButtonIcon;

      overlay.appendChild(playButton);
      overlay.appendChild(muteButton);

      this.overlayElements[index] = overlay;
      this.playButtons[index] = playButton;
      this.muteButtons[index] = muteButton;

      return overlay;
    }

    _createThumbnail(index) {
      if (!this.options.showThumbnail) return null;

      const videoId = extractVideoId(this.videos[index]);
      if (!videoId) return null;

      const thumbnail = document.createElement("div");
      thumbnail.className = this.options.thumbnailClass;
      thumbnail.classList.add("videoshort-thumbnail-hidden");
      thumbnail.setAttribute("data-thumbnail-index", index);
      thumbnail.setAttribute("data-instance-id", this._instanceId);
      thumbnail.style.setProperty(
        "--videoshort-thumbnail-transition",
        this.options.thumbnailTransitionDuration,
      );

      thumbnail.innerHTML = this.options.thumbnailFallbackIcon;
      thumbnail.style.display = "flex";
      thumbnail.style.alignItems = "center";
      thumbnail.style.justifyContent = "center";
      thumbnail.style.backgroundColor = "#1a1a1a";
      thumbnail.style.color = "#555";

      this._loadThumbnailImage(index, thumbnail, videoId);

      this.thumbnailElements[index] = thumbnail;
      return thumbnail;
    }

    _loadThumbnailImage(index, thumbnail, videoId) {
      const maxresUrl = `https://i.ytimg.com/vi_webp/${videoId}/maxresdefault.webp`;
      const hqUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      const testImage = new Image();

      testImage.onload = () => {
        thumbnail.style.backgroundImage = `url(${maxresUrl})`;
        thumbnail.innerHTML = "";
        thumbnail.style.backgroundColor = "";
        this.thumbnailLoaded.add(index);
      };

      testImage.onerror = () => {
        const fallbackImage = new Image();
        fallbackImage.onload = () => {
          thumbnail.style.backgroundImage = `url(${hqUrl})`;
          thumbnail.innerHTML = "";
          thumbnail.style.backgroundColor = "";
          this.thumbnailLoaded.add(index);
        };
        fallbackImage.onerror = () => {
          console.warn(`Thumbnail not found for video ${videoId}`);
        };
        fallbackImage.src = hqUrl;
      };

      testImage.src = maxresUrl;
    }

    _showThumbnail(index) {
      const thumbnails = document.querySelectorAll(
        `[data-instance-id="${this._instanceId}"][data-thumbnail-index="${index}"]`,
      );
      thumbnails.forEach((thumb) => {
        thumb.classList.remove("videoshort-thumbnail-hidden");
      });

      const playButtons = document.querySelectorAll(
        `[data-instance-id="${this._instanceId}"][data-video-index="${index}"] .${this.options.playButtonClass}`,
      );
      playButtons.forEach((btn) => {
        btn.classList.add("videoshort-play-button-visible");
      });
    }

    _hideThumbnail(index) {
      const thumbnails = document.querySelectorAll(
        `[data-instance-id="${this._instanceId}"][data-thumbnail-index="${index}"]`,
      );
      thumbnails.forEach((thumb) => {
        thumb.classList.add("videoshort-thumbnail-hidden");
      });

      const playButtons = document.querySelectorAll(
        `[data-instance-id="${this._instanceId}"][data-video-index="${index}"] .${this.options.playButtonClass}`,
      );
      playButtons.forEach((btn) => {
        btn.classList.remove("videoshort-play-button-visible");
      });
    }

    _togglePlayPause(index) {
      if (!this.players[index]) return;

      const player = this.players[index];
      let actualState = null;
      try {
        actualState = player.getPlayerState();
      } catch (e) {}

      const isActuallyPlaying = actualState === 1;

      if (isActuallyPlaying) {
        // Pausar e atualizar botão imediatamente
        this._setButtonState(index, false);
        this.pause(index);
      } else {
        // Tocar e atualizar botão imediatamente
        this._setButtonState(index, true);
        this.play(index);
      }
    }

    _setButtonState(index, isPlaying) {
      // Atualizar estado interno
      this.playerStates[index] = this.playerStates[index] || {};
      this.playerStates[index].playing = isPlaying;

      // Atualizar TODOS os botões com esse índice em todo o documento
      const buttons = document.querySelectorAll(
        `[data-instance-id="${this._instanceId}"][data-video-index="${index}"] .${this.options.playButtonClass}`
      );

      buttons.forEach(btn => {
        btn.innerHTML = isPlaying ? this.options.pauseButtonIcon : this.options.playButtonIcon;
        btn.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
      });
    }

    _updatePlayButton(index, forceState = null) {
      let isActuallyPlaying = false;

      if (forceState !== null) {
        isActuallyPlaying = forceState;
      } else if (this.players[index]) {
        try {
          const actualState = this.players[index].getPlayerState();
          isActuallyPlaying = actualState === 1;
        } catch (e) {
          const state = this.playerStates[index];
          isActuallyPlaying = state && state.playing;
        }
      }

      const buttons = document.querySelectorAll(
        `[data-instance-id="${this._instanceId}"][data-video-index="${index}"] .${this.options.playButtonClass}`,
      );

      buttons.forEach((btn) => {
        btn.innerHTML = isActuallyPlaying
          ? this.options.pauseButtonIcon
          : this.options.playButtonIcon;
        btn.setAttribute("aria-label", isActuallyPlaying ? "Pause" : "Play");
      });
    }

    _updateMuteButton(index) {
      const state = this.playerStates[index];
      const isMuted = state ? state.muted : this.options.muted;

      const buttons = document.querySelectorAll(
        `[data-instance-id="${this._instanceId}"][data-video-index="${index}"] .${this.options.muteButtonClass}`,
      );

      buttons.forEach((btn) => {
        btn.innerHTML = isMuted
          ? this.options.muteButtonIcon
          : this.options.unmuteButtonIcon;
        btn.setAttribute("aria-label", isMuted ? "Unmute" : "Mute");
      });
    }

    _setupLazyLoading() {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const index = parseInt(
                entry.target.getAttribute("data-video-index"),
              );
              if (!this.loadedVideos.has(index)) {
                this._loadVideo(index);
              }
            }
          });
        },
        {
          root: null,
          rootMargin: this.options.lazyRootMargin,
          threshold: this.options.lazyThreshold,
        },
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

      const playerEl = document.createElement("div");
      playerEl.id = `videoshort-player-${this._instanceId}-${index}`;
      playerEl.style.display = "none";

      if (skeleton) {
        skeleton.parentNode.insertBefore(playerEl, skeleton.nextSibling);
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
        const playerEl = document.getElementById(
          `videoshort-player-${this._instanceId}-${index}`,
        );
        if (!playerEl) {
          resolve();
          return;
        }

        const player = new YT.Player(
          `videoshort-player-${this._instanceId}-${index}`,
          {
            videoId: videoId,
            playerVars: {
              autoplay: this.options.autoplay ? 1 : 0,
              mute: this.options.muted ? 1 : 0,
              loop: this.options.loop ? 1 : 0,
              controls: this.options.controls,
              rel: this.options.rel,
              modestbranding: this.options.modestbranding,
              playsinline: 1,
              enablejsapi: 1,
            },
            events: {
              onReady: (event) => {
                this.playerStates[index] = {
                  muted: this.options.muted,
                  playing: false,
                };

                const itemEl = this.playerElements[index];
                if (itemEl) {
                  const skeleton = itemEl.querySelector(
                    `.${this.options.skeletonClass}`,
                  );
                  if (skeleton) {
                    skeleton.remove();
                  }
                }

                const playerEl = document.getElementById(
                  `videoshort-player-${this._instanceId}-${index}`,
                );
                if (playerEl) {
                  playerEl.style.display = "";
                }

                const overlay = this.overlayElements[index];
                if (overlay) {
                  overlay.classList.remove("videoshort-overlay-hidden");
                }

                // Só atualiza o botão se o player não estiver tocando
                // para não sobrescrever o estado do onStateChange
                try {
                  const currentState = this.players[index].getPlayerState();
                  const isPlaying = currentState === 1; // YT.PlayerState.PLAYING
                  this._updatePlayButton(index, isPlaying);
                } catch (e) {
                  this._updatePlayButton(index, false);
                }

                this._updateMuteButton(index);

                if (this.options.showThumbnail) {
                  this._showThumbnail(index);
                }

                if (this.options.onReady) {
                  this.options.onReady(event, index, this);
                }
                resolve();
              },
              onStateChange: (event) => {
                this.playerStates[index] = this.playerStates[index] || {};
                this.playerStates[index].playing =
                  event.data === YT.PlayerState.PLAYING;

                const isPlaying = event.data === YT.PlayerState.PLAYING;
                this._updatePlayButton(index, isPlaying);

                if (this.options.showThumbnail) {
                  if (event.data === YT.PlayerState.PLAYING) {
                    this._hideThumbnail(index);
                  } else if (
                    event.data === YT.PlayerState.PAUSED &&
                    this.options.showThumbnailOnPause
                  ) {
                    this._showThumbnail(index);
                  } else if (event.data === YT.PlayerState.ENDED) {
                    this._showThumbnail(index);
                  }
                }

                if (this.options.onStateChange) {
                  this.options.onStateChange(event, index, this);
                }

                if (
                  event.data === YT.PlayerState.PLAYING &&
                  this.options.onPlay
                ) {
                  this.options.onPlay(event, index, this);
                }

                if (event.data === YT.PlayerState.ENDED && this.options.onEnd) {
                  this.options.onEnd(event, index, this);
                }
              },
              onError: (event) => {
                if (this.options.onError) {
                  this.options.onError(event, index, this);
                }
                resolve();
              },
            },
          },
        );

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
      this.playerElements.forEach((el) => {
        if (el) this._applyStyles(el, itemStyles);
      });

      return this;
    }

    play(index) {
      if (index !== undefined) {
        this._cueVideoState[index] = false;
        if (this.options.showThumbnail) {
          this._hideThumbnail(index);
        }
        // Atualizar botão imediatamente
        this._setButtonState(index, true);
        if (this.players[index]) {
          this.players[index].playVideo();
        } else if (!this.loadedVideos.has(index)) {
          this._loadVideo(index).then(() => {
            setTimeout(() => this.players[index]?.playVideo(), 100);
          });
        }
      } else {
        this.players.forEach((player, i) => {
          this._cueVideoState[i] = false;
          if (this.options.showThumbnail) {
            this._hideThumbnail(i);
          }
          // Atualizar botão imediatamente
          this._setButtonState(i, true);
          if (player) player.playVideo();
        });
      }
      return this;
    }

    pause(index) {
      if (index !== undefined && this.players[index]) {
        // Atualizar botão imediatamente
        this._setButtonState(index, false);
        this.players[index].pauseVideo();
        if (this.options.showThumbnail && this.options.showThumbnailOnPause) {
          this._showThumbnail(index);
        }
      } else {
        this.players.forEach((player, i) => {
          // Atualizar botão imediatamente
          this._setButtonState(i, false);
          if (player) player.pauseVideo();
          if (this.options.showThumbnail && this.options.showThumbnailOnPause) {
            this._showThumbnail(i);
          }
        });
      }
      return this;
    }

    stop(index) {
      if (index !== undefined && this.players[index]) {
        // Atualizar botão imediatamente
        this._setButtonState(index, false);
        this.players[index].stopVideo();
        if (this.options.showThumbnail) {
          this._showThumbnail(index);
        }
      } else {
        this.players.forEach((player, i) => {
          // Atualizar botão imediatamente
          this._setButtonState(i, false);
          if (player) player.stopVideo();
          if (this.options.showThumbnail) {
            this._showThumbnail(i);
          }
        });
      }
      return this;
    }

    mute(index) {
      if (index !== undefined && this.players[index]) {
        if (typeof this.players[index].mute === "function") {
          this.players[index].mute();
          if (this.playerStates[index]) this.playerStates[index].muted = true;
          this._updateMuteButton(index);
        }
      } else {
        this.players.forEach((player, i) => {
          if (player && typeof player.mute === "function") {
            player.mute();
            if (this.playerStates[i]) this.playerStates[i].muted = true;
            this._updateMuteButton(i);
          }
        });
      }
      return this;
    }

    unMute(index) {
      if (index !== undefined && this.players[index]) {
        if (typeof this.players[index].unMute === "function") {
          this.players[index].unMute();
          if (this.playerStates[index]) this.playerStates[index].muted = false;
          this._updateMuteButton(index);
        }
      } else {
        this.players.forEach((player, i) => {
          if (player && typeof player.unMute === "function") {
            player.unMute();
            if (this.playerStates[i]) this.playerStates[i].muted = false;
            this._updateMuteButton(i);
          }
        });
      }
      return this;
    }

    toggleMute(index) {
      if (index !== undefined && this.playerStates[index]) {
        return this.playerStates[index].muted
          ? this.unMute(index)
          : this.mute(index);
      }
      return this;
    }

    setVolume(volume, index) {
      const vol = Math.max(0, Math.min(100, volume));
      if (index !== undefined && this.players[index]) {
        this.players[index].setVolume(vol);
      } else {
        this.players.forEach((player) => player && player.setVolume(vol));
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
        this.players.forEach(
          (player) => player && player.seekTo(seconds, true),
        );
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
      return this.players.filter((p) => p);
    }

    destroy() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
      this.players.forEach((player) => player && player.destroy());
      this.players = [];
      this.playerStates = [];
      this.playerElements = [];
      this.overlayElements = [];
      this.playButtons = [];
      this.muteButtons = [];
      this.thumbnailElements = [];
      this.thumbnailLoaded.clear();
      this.loadedVideos.clear();
      this._clearContainer();
      return this;
    }
  }

  VideoShorts.version = VERSION;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = VideoShorts;
  } else {
    global.VideoShorts = VideoShorts;
  }
})(typeof window !== "undefined" ? window : this);
