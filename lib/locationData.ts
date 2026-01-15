export interface Location {
  country: string
  regions: {
    name: string
    towns: string[]
  }[]
}

export const LOCATIONS: Location[] = [
  {
    country: 'United Kingdom',
    regions: [
      {
        name: 'England',
        towns: [
          'London', 'Manchester', 'Birmingham', 'Leeds', 'Liverpool', 'Newcastle', 'Sheffield',
          'Bristol', 'Leicester', 'Coventry', 'Nottingham', 'Southampton', 'Portsmouth',
          'Brighton', 'Reading', 'Northampton', 'Luton', 'Bolton', 'Bournemouth', 'Norwich',
          'Swindon', 'Southend-on-Sea', 'Milton Keynes', 'Peterborough', 'Cambridge', 'Oxford',
          'York', 'Bath', 'Canterbury', 'Durham', 'Exeter', 'Plymouth', 'Ipswich', 'Colchester'
        ]
      },
      {
        name: 'Scotland',
        towns: [
          'Edinburgh', 'Glasgow', 'Aberdeen', 'Dundee', 'Inverness', 'Perth', 'Stirling',
          'Ayr', 'Dumfries', 'Falkirk', 'Livingston', 'Paisley', 'Kilmarnock', 'Cumbernauld',
          'Greenock', 'Hamilton', 'Kirkcaldy', 'Motherwell', 'St Andrews', 'Fort William'
        ]
      },
      {
        name: 'Wales',
        towns: [
          'Cardiff', 'Swansea', 'Newport', 'Wrexham', 'Barry', 'Caerphilly', 'Rhondda',
          'Port Talbot', 'Bridgend', 'Llanelli', 'Merthyr Tydfil', 'Aberystwyth', 'Bangor',
          'Carmarthen', 'Haverfordwest', 'Mold', 'Pembroke', 'Tenby', 'Conwy', 'Llandudno'
        ]
      },
      {
        name: 'Northern Ireland',
        towns: [
          'Belfast', 'Derry', 'Lisburn', 'Newry', 'Bangor', 'Craigavon', 'Castlereagh',
          'Carrickfergus', 'Newtownabbey', 'Coleraine', 'Omagh', 'Enniskillen', 'Armagh',
          'Downpatrick', 'Ballymena', 'Larne', 'Strabane', 'Limavady', 'Newtownards', 'Banbridge'
        ]
      }
    ]
  },
  {
    country: 'Ireland',
    regions: [
      {
        name: 'Republic of Ireland',
        towns: [
          'Dublin', 'Cork', 'Limerick', 'Galway', 'Waterford', 'Drogheda', 'Kilkenny',
          'Wexford', 'Sligo', 'Clonmel', 'Navan', 'Ennis', 'Carlow', 'Tralee', 'Newbridge',
          'Naas', 'Athlone', 'Portlaoise', 'Mullingar', 'Letterkenny', 'Tullamore', 'Killarney',
          'Arklow', 'Cobh', 'Shannon', 'Dundalk', 'Bray', 'Swords', 'Balbriggan', 'Celbridge'
        ]
      },
      {
        name: 'Northern Ireland',
        towns: [
          'Belfast', 'Derry', 'Lisburn', 'Newry', 'Bangor', 'Craigavon', 'Castlereagh',
          'Carrickfergus', 'Newtownabbey', 'Coleraine', 'Omagh', 'Enniskillen', 'Armagh',
          'Downpatrick', 'Ballymena', 'Larne', 'Strabane', 'Limavady', 'Newtownards', 'Banbridge'
        ]
      }
    ]
  }
]

export const getAllCountries = () => LOCATIONS.map(loc => loc.country)

export const getRegionsByCountry = (country: string) => {
  const location = LOCATIONS.find(loc => loc.country === country)
  return location ? location.regions : []
}

export const getTownsByRegion = (country: string, region: string) => {
  const location = LOCATIONS.find(loc => loc.country === country)
  if (!location) return []
  const regionData = location.regions.find(r => r.name === region)
  return regionData ? regionData.towns : []
}


