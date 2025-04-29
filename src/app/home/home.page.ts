import { Component, ElementRef, ViewChild } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { Network } from '@capacitor/network';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})

export class HomePage {
  apiKey = '2a97d0b9d39c1e3a39e8e3d20318a214';
  cityName: string = '';
  latitude: number | null = null;
  longitude: number | null = null;
  locateName: string = '';
  temperature: number | null = null;
  humidity: number | null = null;
  windSpeed: number | null = null;
  weatherIcon: string = '';
  hourlyWeather: any[] = [];
  fiveDayForecast: any[] = [];
  errorMessage: string | null = null;
  isOnline: boolean = true;
  isHourlyForecastVisible: boolean = false;
  isFiveDayForecastVisible: boolean = false;

  constructor(private http: HttpClient) {}

  async ngOnInit() {
    const status = await Network.getStatus();
    this.isOnline = status.connected;

    Network.addListener('networkStatusChange', (status) => {
      this.isOnline = status.connected;
      if (!this.isOnline) {
        this.loadCachedWeatherData();
        this.loadCachedForecastData();
        this.errorMessage = 'You are offline. Displaying cached data.';
      } else {
        this.refreshWeatherData();
      }
    });

    if (this.isOnline) {
      await this.getCurrentLocation();
    } else {
      this.loadCachedWeatherData();
      this.loadCachedForecastData();
      this.errorMessage = 'You are offline. Displaying cached data.';
    }
  }

  onSearchClick() {
    if (this.cityName.trim() === '') {
      this.errorMessage = 'Please enter a valid city';
      return;
    }
  
    const units = 'metric';
    const URL = `https://api.openweathermap.org/data/2.5/weather?q=${this.cityName}&appid=${this.apiKey}&units=${units}`;
  
    this.http.get<any>(URL).subscribe(
      (data) => {
        this.locateName = data.name || 'Unknown Location';
        this.temperature = parseFloat(data.main.temp.toFixed(2));
        this.humidity = data.main.humidity;
        this.windSpeed = data.wind.speed;
  
        if (data.weather.length > 0 && data.weather[0].icon) {
          this.weatherIcon = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
        } else {
          this.weatherIcon = 'assets/default-weather-icon.png';
        }
  
        this.latitude = data.coord.lat;
        this.longitude = data.coord.lon;
        if (this.latitude !== null && this.longitude !== null) {
          this.getForecastData(this.latitude, this.longitude);
        }
  
        this.errorMessage = null;
  
        this.cacheWeatherData({
          locationName: this.locateName,
          temperature: this.temperature,
          humidity: this.humidity,
          windSpeed: this.windSpeed,
          weatherIcon: this.weatherIcon,
        });
      },
      (error) => {
        this.errorMessage = 'Failed to fetch weather data. Please check your input.';
        this.loadCachedWeatherData();
      }
    );
  }
  
  async getCurrentLocation() {
    try {
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });

      this.latitude = coordinates.coords.latitude;
      this.longitude = coordinates.coords.longitude;

      this.refreshWeatherData();
    } catch (error) {
      this.errorMessage = 'Failed to get location. Please enable GPS.';
      this.locateName = 'Unknown Location';
      this.loadCachedWeatherData();
    }
  }

  refreshWeatherData() {
    if (this.latitude !== null && this.longitude !== null) {
      this.getWeatherData(this.latitude, this.longitude);
      this.getForecastData(this.latitude, this.longitude);
    }
  }

  getWeatherData(lat: number, lon: number) {
    const units = 'metric';
    const weatherURL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=${units}`;
  
    this.http.get<any>(weatherURL).subscribe(
      (data) => {
        this.locateName = data.name || 'Unknown Location';
        this.temperature = parseFloat(data.main.temp.toFixed(2));
        this.humidity = data.main.humidity;
        this.windSpeed = data.wind.speed;
  
        if (data.weather.length > 0 && data.weather[0].icon) {
          this.weatherIcon = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
        } else {
          this.weatherIcon = 'assets/default-weather-icon.png';
        }
  
        this.cacheWeatherData({
          locationName: this.locateName,
          temperature: this.temperature,
          humidity: this.humidity,
          windSpeed: this.windSpeed,
          weatherIcon: this.weatherIcon,
        });
      },
      (error) => {
        this.errorMessage = 'Failed to fetch weather data. Please try again later.';
        this.loadCachedWeatherData();
      }
    );
  }

  getForecastData(lat: number, lon: number) {
    const units = 'metric';
    const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=${units}`;
  
    this.http.get<any>(forecastURL).subscribe(
      (data) => {
        const now = new Date();
  
        this.hourlyWeather = data.list
          .filter((item: any) => {
            const itemDate = new Date(item.dt_txt);
            return itemDate >= now && itemDate < new Date(now.getTime() + 24 * 60 * 60 * 1000);
          })
          .map((item: any) => ({
            time: new Date(item.dt_txt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            temp: parseFloat(item.main.temp.toFixed(2)),
            icon: `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`,
          }));
  
        const dailyData = data.list.filter((item: any) => item.dt_txt.includes('12:00:00'));
        this.fiveDayForecast = dailyData.map((item: any) => ({
          date: new Date(item.dt_txt).toLocaleDateString(),
          temp: parseFloat(item.main.temp.toFixed(2)),
          icon: item.weather[0]?.icon
            ? `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`
            : 'assets/default-weather-icon.png',
        }));
  
        this.cacheForecastData({
          hourlyWeather: this.hourlyWeather,
          fiveDayForecast: this.fiveDayForecast,
        });
      },
      (error) => {
        this.errorMessage = 'Failed to fetch forecast data. Please try again later.';
        this.loadCachedForecastData();
      }
    );
  }

  cacheWeatherData(data: any) {
    localStorage.setItem('weatherData', JSON.stringify(data));
  }

  loadCachedWeatherData() {
    const cachedData = localStorage.getItem('weatherData');
    if (cachedData) {
      const data = JSON.parse(cachedData);
      this.locateName = data.locationName;
      this.temperature = data.temperature;
      this.humidity = data.humidity;
      this.windSpeed = data.windSpeed;
      this.weatherIcon = data.weatherIcon;
    } else {
      this.errorMessage = 'No cached weather data available.';
    }
  }

  cacheForecastData(data: any) {
    localStorage.setItem('forecastData', JSON.stringify(data));
  }

  loadCachedForecastData() {
    const cachedData = localStorage.getItem('forecastData');
    if (cachedData) {
      const data = JSON.parse(cachedData);
      this.hourlyWeather = data.hourlyWeather;
      this.fiveDayForecast = data.fiveDayForecast;
    } else {
      this.errorMessage = 'No cached forecast data available.';
    }
  }  

  showHourlyForecast() {
    this.isHourlyForecastVisible = true;
    this.isFiveDayForecastVisible = false; // Hide the 5-day forecast
  }

  showFiveDayForecast() {
    this.isFiveDayForecastVisible = true;
    this.isHourlyForecastVisible = false; // Hide the hourly forecast
  }
}