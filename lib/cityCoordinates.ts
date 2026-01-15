// City coordinates for UK and Ireland
export interface CityCoordinates {
  name: string
  latitude: number
  longitude: number
}

export const CITY_COORDINATES: Record<string, CityCoordinates> = {
  // England
  'London': { name: 'London', latitude: 51.5074, longitude: -0.1278 },
  'Manchester': { name: 'Manchester', latitude: 53.4808, longitude: -2.2426 },
  'Birmingham': { name: 'Birmingham', latitude: 52.4862, longitude: -1.8904 },
  'Leeds': { name: 'Leeds', latitude: 53.8008, longitude: -1.5491 },
  'Liverpool': { name: 'Liverpool', latitude: 53.4084, longitude: -2.9916 },
  'Newcastle': { name: 'Newcastle', latitude: 54.9783, longitude: -1.6178 },
  'Sheffield': { name: 'Sheffield', latitude: 53.3811, longitude: -1.4701 },
  'Bristol': { name: 'Bristol', latitude: 51.4545, longitude: -2.5879 },
  'Leicester': { name: 'Leicester', latitude: 52.6369, longitude: -1.1398 },
  'Coventry': { name: 'Coventry', latitude: 52.4068, longitude: -1.5197 },
  'Nottingham': { name: 'Nottingham', latitude: 52.9548, longitude: -1.1581 },
  'Southampton': { name: 'Southampton', latitude: 50.9097, longitude: -1.4044 },
  'Portsmouth': { name: 'Portsmouth', latitude: 50.8198, longitude: -1.0880 },
  'Brighton': { name: 'Brighton', latitude: 50.8225, longitude: -0.1372 },
  'Reading': { name: 'Reading', latitude: 51.4543, longitude: -0.9781 },
  'Cambridge': { name: 'Cambridge', latitude: 52.2053, longitude: 0.1218 },
  'Oxford': { name: 'Oxford', latitude: 51.7520, longitude: -1.2577 },
  'York': { name: 'York', latitude: 53.9600, longitude: -1.0873 },
  'Bath': { name: 'Bath', latitude: 51.3758, longitude: -2.3599 },
  
  // Scotland
  'Edinburgh': { name: 'Edinburgh', latitude: 55.9533, longitude: -3.1883 },
  'Glasgow': { name: 'Glasgow', latitude: 55.8642, longitude: -4.2518 },
  'Aberdeen': { name: 'Aberdeen', latitude: 57.1497, longitude: -2.0943 },
  'Dundee': { name: 'Dundee', latitude: 56.4620, longitude: -2.9707 },
  'Inverness': { name: 'Inverness', latitude: 57.4778, longitude: -4.2247 },
  'Stirling': { name: 'Stirling', latitude: 56.1165, longitude: -3.9369 },
  
  // Wales
  'Cardiff': { name: 'Cardiff', latitude: 51.4816, longitude: -3.1791 },
  'Swansea': { name: 'Swansea', latitude: 51.6214, longitude: -3.9436 },
  'Newport': { name: 'Newport', latitude: 51.5842, longitude: -2.9977 },
  'Wrexham': { name: 'Wrexham', latitude: 53.0430, longitude: -2.9925 },
  
  // Northern Ireland
  'Belfast': { name: 'Belfast', latitude: 54.5973, longitude: -5.9301 },
  'Derry': { name: 'Derry', latitude: 54.9966, longitude: -7.3086 },
  'Lisburn': { name: 'Lisburn', latitude: 54.5167, longitude: -6.0333 },
  
  // Ireland
  'Dublin': { name: 'Dublin', latitude: 53.3498, longitude: -6.2603 },
  'Cork': { name: 'Cork', latitude: 51.8985, longitude: -8.4756 },
  'Limerick': { name: 'Limerick', latitude: 52.6638, longitude: -8.6268 },
  'Galway': { name: 'Galway', latitude: 53.2707, longitude: -9.0568 },
  'Waterford': { name: 'Waterford', latitude: 52.2593, longitude: -7.1101 },
}

export const getCityCoordinates = (cityName: string): CityCoordinates | null => {
  // Try exact match first
  if (CITY_COORDINATES[cityName]) {
    return CITY_COORDINATES[cityName]
  }
  
  // Try matching by city name only (remove region/country)
  const cityOnly = cityName.split(',')[0].trim()
  if (CITY_COORDINATES[cityOnly]) {
    return CITY_COORDINATES[cityOnly]
  }
  
  return null
}


