'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance; // km
    this.duration = duration; // min
  }

  _setDescription() {
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      monthNames[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  get getId() {
    return this.id;
  }
  get getDate() {
    return this.date;
  }

  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this.type = 'running';
    this._setDescription();
  }

  calcPace() {
    this.pace = this.duration / this.distance; // min / km
    return this.pace;
  }
}

class Cycling extends Workout {
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this.type = 'cycling';
    this._setDescription();
  }

  calcSpeed() {
    this.speed = this.distance / this.duration; // km/h
    return this.speed;
  }
}

const run1 = new Running([39, -12], 5.2, 24, 178);
const cycling1 = new Running([39, -12], 27, 95, 523);
console.log(run1, cycling1);

class App {
  #map;
  #mapEvent;
  #mapZoomLevel = 13;
  #workouts = [];

  constructor() {
    this._getPosition();

    this._getLocalStorage();

    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener(
      'click',
      this._handleWorkoutClick.bind(this)
    );
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get current position');
        }
      );
    }
  }
  _loadMap(position) {
    const { latitude, longitude } = position.coords;

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    // Empty inputs
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();
    // Get data from the form
    const type = inputType.value;
    const distance = Number(inputDistance.value);
    const duration = Number(inputDuration.value);
    const { lat, lng } = this.#mapEvent.latlng;

    let workout;

    // Check if data is valid
    const isValid = (...inputs) =>
      inputs.every(input => Number.isFinite(input));
    const isPositive = (...inputs) => inputs.every(input => input > 0);

    if (!isValid(distance, duration) || !isPositive(distance, duration))
      return alert('Data cannot be negative!!');

    // If workout running, create running object
    if (type === 'running') {
      const cadence = Number(inputCadence.value);

      if (!isValid(cadence) || !isPositive(cadence))
        return alert('Cadence cannot be negative!!');

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // If workout cycling, create cycling object
    if (type === 'cycling') {
      const elevation = Number(inputElevation.value);

      if (!isValid(elevation) || !isPositive(elevation))
        return alert('Elevation gain cannot be negative!!');

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Add new object to workout array
    this.#workouts.push(workout);

    // Render workout on map as marker
    this._renderWorkoutMarker(workout);

    // Render workout on list
    this._renderWorkout(workout);

    // Clear input fields
    this._hideForm();

    // Set workout to local storage
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>
      `;
    if (workout.type === 'running') {
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
        <button class="workout__edit">✏️ Edit</button>
        <button class="workout__delete">🗑️ Delete</button>
      </li>`;
    }

    if (workout.type === 'cycling') {
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
        <button class="workout__edit">✏️ Edit</button>
        <button class="workout__delete">🗑️ Delete</button>
      </li>`;
    }
    form.insertAdjacentHTML('afterend', html);
  }

  _handleWorkoutClick(e) {
    // Check if edit button was clicked
    if (e.target.classList.contains('workout__edit')) {
      this._editWorkout(e);
    }

    // Check if delete button was clicked
    if (e.target.classList.contains('workout__delete')) {
      this._deleteWorkout(e);
    }
  }

  _editWorkout(e) {
    const workoutEL = e.target.closest('.workout');
    console.log(workoutEL);

    if (!workoutEL) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEL.dataset.id
    );
    if (!workout) return;

    inputType.value = workout.type;
    inputDistance.value = workout.distance;
    inputDuration.value = workout.duration;
    if (workout.type === 'running') {
      inputCadence.value = workout.cadence;
      console.log(inputCadence.value);
      this._toggleElevationField(); // Show cadence input
    } else if (workout.type === 'cycling') {
      inputElevation.value = workout.elevationGain;
      console.log(inputElevation.value);
      this._toggleElevationField(); // Show cadence input
    }
    this._showForm({
      latlng: { lat: workout.coords[0], lng: workout.coords[1] },
    });

    // Remove old workout from the list and update the state
    this.#workouts = this.#workouts.filter(work => work.id !== workout.id);
    workoutEL.remove();
  }

  _deleteWorkout(e) {
    console.log(e.target);
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;
    console.log(workoutEl); // checked

    const workoutId = workoutEl.dataset.id;
    const workout = this.#workouts.find(work => work.id === workoutId);
    console.log(workout);
    console.log(workoutId);

    // Remove from workouts array
    this.#workouts = this.#workouts.filter(work => work.id !== workoutId);

    // Remove from map
    this.#map.eachLayer(layer => {
      if (layer instanceof L.Marker) {
        if (layer.getLatLng().equals(workout.coords)) {
          this.#map.removeLayer(layer);
        }
      }
    });

    // Remove from local storage
    this._setLocalStorage();

    // Remove from the DOM
    workoutEl.remove();
  }

  _moveToPopup(e) {
    if (!this.#map) return;

    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    if (!workout) return;

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: { duration: 1 },
    });

    // workout.click();
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    this.#workouts = data;
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();

/*
The app enables users to log and visualize running and cycling workouts on an interactive map, with dynamic form adjustments based on workout type. It features local storage for data persistence, custom markers for each workout, and includes robust error handling and validation to ensure accurate data entry. The application also provides a responsive user interface and allows for easy management of workout entries.
*/
