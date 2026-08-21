const PLAYING_STATUS_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="4 4 24 24" fill="currentColor"><path d="M19.376 12.4161L8.77735 19.4818C8.54759 19.635 8.23715 19.5729 8.08397 19.3432C8.02922 19.261 8 19.1645 8 19.0658V4.93433C8 4.65818 8.22386 4.43433 8.5 4.43433C8.59871 4.43433 8.69522 4.46355 8.77735 4.5183L19.376 11.584C19.6057 11.7372 19.6678 12.0477 19.5146 12.2774C19.478 12.3323 19.4309 12.3795 19.376 12.4161Z"></path></svg>';
const PAUSED_STATUS_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="4 4 24 24" fill="currentColor"><path d="M6 5H8V19H6V5ZM16 5H18V19H16V5Z"></path></svg>';
const STOPPED_STATUS_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="4 4 24 24" fill="currentColor"><path d="M6 5H18C18.5523 5 19 5.44772 19 6V18C19 18.5523 18.5523 19 18 19H6C5.44772 19 5 18.5523 5 18V6C5 5.44772 5.44772 5 6 5Z"></path></svg>';

/*

Possible Parameters:
song : provide a direct path to your audio file, for now
  chaining these is the best way to include multiple
name : define a custom name for your music player
no_attribution : please don't do this haha

*/
class JSMP extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ["srcs"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "srcs") {
      this.songs = JSON.parse(newValue);
      this.ParseSongs();
    } else if (name === "title") {
      this.title = newValue;
    }
  }

  connectedCallback() {
    //this.audioSrc = this.getAttribute('src') || '';
    this.shadowRoot.innerHTML = `{{CSS}}{{HTML}}`;
    this.SetupControlListeners();
    this.setupPlayerLogic();
  }

  SetupControlListeners() {
    const prev_btn  = this.shadowRoot.getElementById('webamp-btn-prev');
    const play_btn  = this.shadowRoot.getElementById('webamp-btn-play');
    const pause_btn = this.shadowRoot.getElementById('webamp-btn-pause');
    const stop_btn  = this.shadowRoot.getElementById('webamp-btn-stop');
    const next_btn  = this.shadowRoot.getElementById('webamp-btn-next');

    prev_btn.addEventListener('click',  () => this.Prev());
    play_btn.addEventListener('click',  () => this.Play());
    pause_btn.addEventListener('click', () => this.Pause());
    stop_btn.addEventListener('click',  () => this.Stop());
    next_btn.addEventListener('click',  () => this.Next());
  }

  setupPlayerLogic() {
    this.player = this.shadowRoot.getElementById("audio-player");
    this.player.addEventListener("timeupdate", (event) => {
      if (!this.player.paused) {
        this.scrubber.value = (this.player.currentTime / this.player.duration) * 100;
      }
      this.player_current_time.textContent = this.ToHumanFriendlyTime(this.player.currentTime, true);
    });

    this.volume_slider = this.shadowRoot.getElementById("webamp-player-volume-slider");
    this.volume_slider.addEventListener("change", (event) => {
      this.player.volume = event.target.value / 100;
    });

    this.scrubber = this.shadowRoot.getElementById("webamp-player-scrubber");
    this.scrubber.addEventListener("input", (event) => {
      if (this.player.paused) {
        this.scrubber.value = 0;
      } else {
        this.player.currentTime = (this.scrubber.value / 100) * this.player.duration;
      }
    });

    this.playlist = this.shadowRoot.getElementById("webamp-playlist");
    this.playlist_internal_list = this.playlist.getElementsByTagName("ol")[0];

    this.player_controls = this.shadowRoot.getElementById("webamp-player-controls");
    this.player_current_time = this.shadowRoot.getElementById("webamp-player-current-time");

    this.display_status = this.shadowRoot.getElementById("webamp-player-status");

    this.current_song_index = 0;

    this.list_items = [];

    this.loop = true;

    if (this.title) {
      this.shadowRoot.getElementById("webamp-player-display-name").textContent = this.title;
    }

    /*
    const maybe_include_no_attribution = params.get("no_attribution");
    if (maybe_include_no_attribution && maybe_include_no_attribution == "true") {
      this.shadowRoot.getElementById("webamp-player-attribution").innerHTML = "";
    }*/
  }

  SetCurrentSong(new_song_index, autoplay = false) {
    this.current_song_index = new_song_index;
    this.player.currentTime=0;
    this.player.src=this.songs[this.current_song_index].audio.src;

    this.list_items.forEach((item) => {item.classList = "unselected";});
    this.list_items[this.current_song_index].classList = "selected";

    const title = this.songs[this.current_song_index].tags.title;
    const artist = this.songs[this.current_song_index].tags.artist;
    const items = this.shadowRoot.getElementById("webamp-player-current-song").getElementsByClassName("ticker-item");

    for (let i = 0; i < items.length; i++) {items[i].textContent=`${artist} - ${title}`;}
    if (autoplay) {this.player.play();}
  }

  ToHumanFriendlyTime(duration, should_pad_start = false) {
    let seconds = isFinite(duration) ? duration.toFixed(0) : 0;
    const minutes = Math.floor(seconds / 60); seconds = seconds % 60;
    return `${should_pad_start ? minutes.toString().padStart(2, '0') : minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  Play() {
    switch (this.player.readyState) {
      case 0:
        this.display_status.innerHTML=PLAYING_STATUS_SVG;
        this.SetCurrentSong(0, true);
        break;
      case 4:
        this.display_status.innerHTML=PLAYING_STATUS_SVG;
        this.player.play();
        break;
    }
  }
  Pause() {
    switch (this.player.readyState) {
      case 0:
        break;
      case 4:
        this.display_status.innerHTML=PAUSED_STATUS_SVG;
        this.player.pause();
        break;
    }
  }
  Stop() {
    this.list_items.forEach((item) => {item.classList = "unselected";});
    this.display_status.innerHTML=STOPPED_STATUS_SVG;
    this.player.src="";this.scrubber.value=0;
    let items = this.shadowRoot.getElementById("webamp-player-current-song").getElementsByClassName("ticker-item");
    for (let i = 0; i < items.length; i++) {items[i].textContent="";}
  }

  // TODO; add the same switch statements in all of these similar
  // commands
  Next() {
    if (this.current_song_index < this.songs.length - 1) {
      this.SetCurrentSong(this.current_song_index+1, true);
    } else {
      if (this.loop) {
        this.SetCurrentSong(0, true);
      }
    }
  }

  Prev() {
    if (this.current_song_index > 0) {
      this.SetCurrentSong(this.current_song_index-1, true);
    } else {
      this.SetCurrentSong(0, true);
    }
  }

  async ParseSongs() {
    const results = await Promise.all(
      this.songs.map((url) => {
        return new Promise((resolve, reject) => {
          const audio = new Audio(url);

          const onLoadedMetadata = async () => {
            try {
              jsmediatags.read(audio.src, {
                onSuccess: function (tag) {
                  resolve({ audio, tags: tag.tags });
                },
                onError: function (error) {
                  reject(error);
                },
              });
            } catch (e) {
              reject(e);
            }
          };

          audio.addEventListener("loadedmetadata", onLoadedMetadata, { once: true });
          audio.addEventListener("error", reject, { once: true });
        });
      })
    );

    results.forEach(({ audio, tags }, i) => {
      const list_item = document.createElement("li");
      list_item.classList += "unselected";
      const entry = document.createElement("button");
      const song_title = tags?.title ?? "Unknown";
      const song_artist = tags?.artist ?? "Unknown";

      entry.classList += "playlist-entry";
      entry.addEventListener("click", () => {
        this.list_items.forEach((item) => {item.classList = "unselected";});
        list_item.classList = "selected";
        this.SetCurrentSong(i, true);
        this.display_status.innerHTML = PLAYING_STATUS_SVG;
      });
      const title = document.createElement("p");
      title.textContent = song_title;
      const durationEl = document.createElement("p");
      durationEl.textContent = this.ToHumanFriendlyTime(audio.duration);

      entry.appendChild(title);
      entry.appendChild(durationEl);
      list_item.appendChild(entry);
      this.list_items.push(list_item);
      this.playlist_internal_list.appendChild(list_item);

      this.songs[i] = { audio, tags };
    });
  }

};
customElements.define('jsmp', JSMP);
