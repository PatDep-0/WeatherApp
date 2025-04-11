import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  apiKey: string = '2a97d0b9d39c1e3a39e8e3d20318a214';

  @ViewChild('cityInputRef') cityInputRef!: ElementRef;
  @ViewChild('tempValRef') tempValRef!: ElementRef;
  @ViewChild('humidityValRef') humidityValRef!: ElementRef;
  @ViewChild('windValRef') windValRef!: ElementRef;

  days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  ngOnInit(): void {
    window.addEventListener('load', () => this.getUserCoordinates());
  }

  getCityCoordinates(): void {
    const cityInput = this.cityInputRef.nativeElement as HTMLInputElement;
    const cityName = cityInput.value.trim();
    if (!cityName) return;
    cityInput.value = '';

    const geoURL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${this.apiKey}`;
    fetch(geoURL)
      .then(res => res.json())
      .then(data => {
        const { name, lat, lon, country, state } = data[0];
        this.getWeatherDetails(name, lat, lon, country, state);
      })
      .catch(err => console.error('Error fetching coordinates:', err));
  }

  getUserCoordinates(): void {
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      const revGeoURL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${this.apiKey}`;
      fetch(revGeoURL)
        .then(res => res.json())
        .then(data => {
          const { name, lat, lon, country, state } = data[0];
          this.getWeatherDetails(name, lat, lon, country, state);
        })
        .catch(err => console.error('Error getting location:', err));
    });
  }

  getWeatherDetails(name: string, lat: number, lon: number, country: string, state: string): void {
    const weatherURL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}`;
    const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}`;

    fetch(weatherURL)
      .then(res => res.json())
      .then(data => {
        const date = new Date();
        const weatherIcon = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
        const temperature = (data.main.temp - 273.15).toFixed(2);
        const description = data.weather[0].description;

        // Update DOM values
        this.tempValRef.nativeElement.innerHTML = `${temperature}&deg;C`;
        this.humidityValRef.nativeElement.innerHTML = `${data.main.humidity}%`;
        this.windValRef.nativeElement.innerHTML = `${data.wind.speed} m/s`;

        // Optionally update other parts of the UI...
      })
      .catch(err => console.error('Weather error:', err));

    fetch(forecastURL)
      .then(res => res.json())
      .then(data => {
        // Handle 5 day forecast here if needed
      })
      .catch(err => console.error('Forecast error:', err));
  }

  onSearchClick(): void {
    this.getCityCoordinates();
  }
}
