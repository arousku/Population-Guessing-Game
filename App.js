import React from 'react';
import './App.css';
import '../node_modules/leaflet/dist/leaflet.css';
import Popup from "reactjs-popup";

// Luodaan Banner-komponentti, joka käyttää reactjs-popup -kirjastoa "?"-buttonin apuna.
class Banner extends React.Component {
  render() {
    return (
      <div className="bannerRow">
        <h1>BIGGER THAN YOURS?
        </h1>
        <Popup trigger={<button className="btn" name="iBtn">?</button>} modal>
          <div className="modal">
            <div className="header"> How to Play</div>
            <div className="content">
              {" "}
              You have been designated a random city. Every round begins with another city
              being generated and displayed on screen. Try to guess whether the other city
              has more population than yours!
              <br/>
              <br/>
              Points scored are relative to the size of your city in comparison to the city
              you are guessing. Smaller difference in population gives more points when guessed
              correctly, meanwhile incorrect guesses will decrease your score in opposite: the
              bigger the difference, the bigger the amount of points lost.
            </div>
          </div>
        </Popup>
      </div>
    )
  }
}

// Luodaan karttakomponentti
class Map extends React.Component {
  constructor(props) {
    super(props);
    this.state = {map: "", selectedCity: []};
    this.mapLoad = this.mapLoad.bind(this);
  }

// Karttakomponentti ajetaan sivun avaamisen yhteydessä
  componentDidMount() {
    this.mapLoad();
  }

// Karttakomponentti päivitetään pääkomponentin uudelleenlatauksen yhteydessä
  componentDidUpdate() {
    this.mapLoad();
  }

// Ladataan Leaflet-karttakirjasto
  mapLoad() {
    let L = require('leaflet');
    document.getElementById('mapid').innerHTML = "<div id='map'></div>";
    // Syötetään mymap-muuttujaan satunnaisesti generoidun kaupungin koordinaatit
    let mymap = L.map('map', {
      attributionControl: false,
      zoomControl: false
    }).setView([this.props.rnd[2], this.props.rnd[3]], 12);
    // Syötetään mapbox-käyttövaltuudet sekä käytetty karttatieto
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
      attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery Â© <a href="https://www.mapbox.com/">Mapbox</a>',
      maxZoom: 18,
      id: 'mapbox.streets',
      accessToken: 'pk.eyJ1IjoibTE0ODQiLCJhIjoiY2p6em5wOTc2MWN5NDNncTlibXhsNWs4YyJ9.GGbUC2CMJJbOxHjk_A2NAg'
    }).addTo(mymap);
  }

  render() {
    return (
      <div id="mapid"></div>
    );
  }
}

// Luodaan tuloskomponentti
class Results extends React.Component {
  render() {
    // Jos käyttäjä arvaa oikein, palautetaan tämä. Pääkomponentista haetaan propit city, population ja points,
    // jotka esitetään ruudulla.
    if (this.props.correct === true)
      return (
        <div id="resultid">
          <p><font color="#7cfc00">Correct!</font> <font color="orange">{this.props.city}</font> has a population
            of {this.props.population}.
            You gained {this.props.points} points. :-)</p>
          <br/>
        </div>
      );
    // Jos käyttäjä arvaa väärin, palautetaan tämä.
    else if (this.props.correct === false) {
      return (
        <div id="resultid">
          <p><font color="red">Incorrect!</font> <font color="orange">{this.props.city}</font> has a population
            of {this.props.population}.
            You lost {this.props.points} points. :'-(</p>
          <br/>
        </div>
      );
    }
    // Alkutilanteessa palautetaan ruudulle tämä.
    else {
      return (
        <div id="resultid">
          <p>Time to guess!</p>
          <br/>
          <br/>
        </div>
      );
    }
  }
}

// Ladataan pääkomponentti
class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      cities: [], cityRnd: "", yourCityRnd: "", loaded: false, citiesInvoked: false,
      score: 0, points: 0, turn: 1, correct: "", countryLoaded: false
    };
  }

  // Pääkomponentti ajettaessa ensimmäistä kertaan haetaan kaikki kaupungit
  componentDidMount() {
    this.getCities();
  }

  // Pääkomponenttia uudelleenladattaessa haetaan uusi kaupunki
  onReload() {
    this.loadCity();
  }

  // Haetaan json-tiedostosta kaupungit
  getCities() {
    var cityList = require('./cities.json');
    // Nollataan alkutilanne
    this.setState({
        cities: cityList.records, loaded: true, yourCityRnd: "", turn: 1, score: 0, correct: "",
        resultCity: "", resultPop: ""
      },
      function () {
        this.capitalizeCity();
      });
  }

  // Lisätään iso alkukirjain jokaiseen kaupunkiin
  capitalizeCity() {
    let allCities = this.state.cities;

    // Rakennetaan string uudelleen ensimmäisestä isoksi muutetusta kirjaimesta sekä lopuista kirjaimista
    const toTitleCase = (name) => {
      return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    // Käydään kaikki arrayn kaupunki-objektit läpi ja lisätään iso alkukirjain jokaisen nimeen
    for (let i = 0; i < this.state.cities.length; i++) {
      allCities[i].fields.city = toTitleCase(allCities[i].fields.city);
    }
    // Kun alkukirjaimet on lisätty, viedään array stateen ja tämän jälkeen ajetaan loadCity-muuttuja
    this.setState({cities: allCities}, function () {
      this.loadCity();
    });
  }

  // Jos omaa kaupunkia ei ole satunnaisgeneroitu, ajetaan randomizeCity-funktio.
  // Muulloin ladataan vain vertailukaupunki samalla tavoin. Molemmat asetetaan stateen.
  loadCity() {
    if (this.state.yourCityRnd == false) {
      let yourCity = this.randomizeCity();
      this.setState({yourCityRnd: yourCity});
    }
    let rndCity = this.randomizeCity();
    this.setState({cityRnd: rndCity});
  }

  // Valitaan satunnainen cities-arrayn arvo ja poimitaan tästä uuteen arrayhyn tarvitut arvot.
  // countryURLin avulla countryLoad-nuolimuuttuja hakee valtion täyden nimen cities-arrayn kahden kirjaimen
  // lyhenteestä asynkronisesti. Valtion täysi nimi asetetaan lyhenteen tilalle ja asetetaan countryLoaded-state
  // todeksi. Luodaan arraylle vielä yksi muuttuja, jossa väkilukuun lisätään kolmen numeron välein pilkku luettavuuden
  // helpottamiseksi. Palautetaan city-arvo.
  randomizeCity() {
    let rnd = this.state.cities[Math.floor(Math.random() * this.state.cities.length)];
    let rndCity = [rnd.fields.city, rnd.fields.population, rnd.fields.latitude, rnd.fields.longitude, rnd.fields.country];
    let countryURL = 'https://restcountries.eu/rest/v2/alpha/' + rndCity[4];
    const countryLoad = async () => {
      const response = await fetch(countryURL);
      const myJson = await response.json(); //extract JSON from the http response
      // do something with myJson
      rndCity[4] = myJson.name;
      this.setState({countryLoaded: true});
    };
    rndCity[5] = rndCity[1].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    countryLoad();
    return rndCity;
  }

  // Verrataan kaupunkeja indeksin perusteella.
  compareCities(index) {

    // Lisätään pisteytys ja kierrosnumero väliaikaismuuttujaan. Luodaan suhteellisen pisteytyksen muuttuja.
    let tempScore = this.state.score;
    let tempTurn = this.state.turn;
    let relativePoints;

    // Jos vastaus on oikein, lisätään suhteellinen pisteytys väliaikaismuuttujaan ja asetetaan correctin stateksi
    // tosi.
    const correctAnswer = () => {
      tempScore = tempScore + relativePoints;
      this.setState({correct: true});
    };

    // Jos vastaus on väärin, vähennetään suhteellinen pisteytys muuttujasta ja asetetaan correctin stateksi
    // epätosi. Jos pisteytys menee negatiiviseksi, palautetaan arvoksi nolla.
    const incorrectAnswer = () => {
      tempScore = tempScore - relativePoints;
      this.setState({correct: false});
      if (tempScore < 0) {
        tempScore = 0;
      }
    };

    // Jos vertailukaupunki on suurempi kuin oma kaupunkisi.
    if (this.state.cityRnd[1] > this.state.yourCityRnd[1]) {
      // Ja klikkaat että vertailukaupunki on suurempi kuin oma kaupunkisi.
      if (index === 0) {
        // Lasketaan suhteellinen pisteytys ja ajetaan funktio.
        relativePoints = Math.floor(100 * (this.state.yourCityRnd[1] / this.state.cityRnd[1]));
        correctAnswer();
      } else {
        // Ja klikkaat että vertailukaupunki on pienempi kuin oma kaupunkisi.
        relativePoints = 100 - Math.floor(100 * (this.state.yourCityRnd[1] / this.state.cityRnd[1]));
        incorrectAnswer();
      }
    }
    // Jos vertailukaupunki on pienempi kuin oma kaupunkisi.
    else {
      // Ja klikkaat että vertailukaupunki on pienempi kuin oma kaupunkisi.
      if (index === 1) {
        relativePoints = Math.floor(100 * (this.state.cityRnd[1] / this.state.yourCityRnd[1]));
        correctAnswer();
      }
      // Ja klikkaat että vertailukaupunki on suurempi kuin oma kaupunkisi.
      else {
        relativePoints = 100 - Math.floor(100 * (this.state.cityRnd[1] / this.state.yourCityRnd[1]));
        incorrectAnswer();
      }
    }
    // Kasvatetaan kierrosnumeroa, asetetaan kokonaispistemäärä, kierroksen pistemäärä, kierrosnumero, vertailukaupungin
    // nimi sekä väkiluku stateen ja arvotaan seuraava kaupunki.
    tempTurn++;
    this.setState({
      score: tempScore, points: relativePoints, turn: tempTurn, resultCity: this.state.cityRnd[0],
      resultPop: this.state.cityRnd[5]
    });
    this.loadCity();
  }

  // Tulostetaan ohjelma
  render() {
    // Jos satunnainen kaupunki on valittu, kierrosmäärä on korkeintaan 10 ja valtion nimi ladattu rajapinnasta
    if (this.state.cityRnd && this.state.turn <= 10 && this.state.countryLoaded) {
      return <div className="text">
        <Banner/>
        <div className="container">
          <Results correct={this.state.correct} points={this.state.points} city={this.state.resultCity}
                   population={this.state.resultPop}/>
          <div id="textid">
            <p><font color="orange">{this.state.cityRnd[0]}</font>, {this.state.cityRnd[4]} is...</p>
            <button className="btn" onClick={this.compareCities.bind(this, 0)}>Bigger!</button>
            <button className="btn" onClick={this.compareCities.bind(this, 1)}>Smaller!</button>
          </div>
          <div className="chosenCity" id="textid">
            <p></p>
            <p>... than your city <font color="orange">{this.state.yourCityRnd[0]}</font>, {this.state.yourCityRnd[4]}
            </p>
            <p>with a population of {this.state.yourCityRnd[5]}</p>
            <p>Score: {this.state.score}</p>
            <p>Turn: {this.state.turn}/10</p>
          </div>
        </div>
        <div className="container" id="mapid">
          <Map rnd={this.state.cityRnd}/>
        </div>

      </div>
    }
    // Jos 10 kierrosta on pelattu
    else if (this.state.turn > 10) {
      return (
        <div className="text">
          <Banner/>
          <div id="gameover">
            <Results correct={this.state.correct} points={this.state.points} city={this.state.resultCity}
                     population={this.state.resultPop}/>
            <br></br>
            <h3>Game Over!</h3>
            <p>Final score: {this.state.score}</p>
            <button className="btn" onClick={this.getCities.bind(this)}>Play again?</button>
          </div>

        </div>)
    }
    // Jos tietoja ei vielä ole ladattu
    else {
      return (
        <div className="text">
          <div>Loading...</div>
        </div>
      );
    }
  }

}

export default App;
