"use strict";

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

class Workout {
  date = new Date();
  id = (Date.now() + "").slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
  _setDescription() {
    //prettier-ignore
    const months = ["January","February","March","April","May","June",
      "July","August","September","October","November","December",
    ];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Cycling extends Workout {
  type = "cycling";
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class Running extends Workout {
  type = "running";
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class App {
  _workouts = [];
  _map;
  _mapEvent;
  constructor() {
    //Запуск логики приложения
    this._getPosition();

    //Получение данных из JS
    this._getLocalStorage();
    //Обработчик события который вызывает метод _newWorkout
    form.addEventListener("submit", this._newWorkout.bind(this));

    //Обработчик события который вызывает метод _toggleField
    inputType.addEventListener("change", this._toggleField);
    //
    containerWorkouts.addEventListener("click", this._moveToPlace.bind(this));
  }
  //Метод запроса данных о местоположении от пользователя. В случае успеха, запускается ф-ция _loadMap
  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),

        //Модальное окно в случае отказа
        function () {
          alert("Вы не предоставили доступ к своей геолокации");
        }
      );
  }
  // Метод загрузки карты на страницу в случае положительного ответа о предоставлении своих координат
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];
    this._map = L.map("map").setView(coords, 16);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this._map);
    //Обработчик события нажатия по карте, который запустит метод _showForm
    this._map.on("click", this._showForm.bind(this));

    this._workouts.forEach((work) => this._renderWorkMark(work));
  }
  //Метод который отобразит форму при клике по карте
  _showForm(mapE) {
    this._mapEvent = mapE;
    form.classList.remove("hidden");
    inputDistance.focus();
  }

  //Метод который переключает типы тренировок.
  _toggleField() {
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
  }

  //Метод который установит маркер на карту
  _newWorkout(e) {
    e.preventDefault();
    const validInputs = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp));

    const allPositive = (...inputs) => inputs.every((inp) => inp > 0);
    //Данные из форм
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this._mapEvent.latlng;
    let workout;
    if (type === "running") {
      const cadence = +inputCadence.value;

      if (
        !validInputs(distance, cadence, duration) ||
        !allPositive(distance, cadence, duration)
      ) {
        return alert("Необходимо ввести целое положительное число!");
      }
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    if (type === "cycling") {
      const elevation = +inputElevation.value;

      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      ) {
        return alert("Необходимо ввести целое положительное число!");
      }
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    this._workouts.push(workout);
    //Рендер маркера тренировки на карте
    this._renderWorkMark(workout);
    //Рендер тренировки после отправки формы
    this._renderWorkout(workout);
    //Очистить поля ввода и спрятать форму
    this._hideForm(workout);
    //
    this._setLocalStorage();
  }
  _renderWorkMark(workout) {
    L.marker(workout.coords)
      .addTo(this._map)
      .bindPopup(
        L.popup({
          autoClose: false,
          closeOnClick: false,
          className: "mark-popup",
        })
      )
      .setPopupContent(
        `${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${workout.description}`
      )
      .openPopup();
  }
  //Очистить поля ввода и спрятать форму
  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        "";
    form.classList.add("hidden");
  }

  //Рендер списка тренировок
  _renderWorkout(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">км</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">мин</span>
          </div>`;
    if (workout.type === "running") {
      html += `
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">мин/км</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">шаг</span>
          </div>
        </li>
            `;
    }
    if (workout.type === "cycling") {
      html += `
            <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">км/час</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevation}</span>
          <span class="workout__unit">м</span>
        </div>
      </li>
            `;
    }
    form.insertAdjacentHTML("afterend", html);
  }
  _moveToPlace(e) {
    const workoutEL = e.target.closest(".workout");
    if (!workoutEL) return;

    const workout = this._workouts.find(
      (work) => work.id === workoutEL.dataset.id
    );
    this._map.setView(workout.coords, 17, {
      animate: true,
      pan: { duration: 1 },
    });
  }
  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this._workouts));
  }

  _getLocalStorage() {
    const local = JSON.parse(localStorage.getItem("workouts"));
    console.log(local);
    if (!local) return;

    this._workouts = local;

    this._workouts.forEach((work) => this._renderWorkout(work));
  }
  reset() {
    localStorage.removeItem("workouts");
    location.reload();
  }
}

//Запуск приложения
const app = new App();
