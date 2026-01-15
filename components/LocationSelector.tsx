'use client'

import { useState, useEffect } from 'react'
import { LOCATIONS, getAllCountries, getRegionsByCountry, getTownsByRegion } from '@/lib/locationData'
import { ChevronDown } from 'lucide-react'

interface LocationSelectorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function LocationSelector({ value, onChange, placeholder = 'Select location', className = '' }: LocationSelectorProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState<string>('')
  const [selectedRegion, setSelectedRegion] = useState<string>('')
  const [selectedTown, setSelectedTown] = useState<string>('')

  // Parse existing value if it exists (format: "Town, Region, Country" or "Town, Country")
  useEffect(() => {
    if (value && !selectedCountry && !selectedRegion && !selectedTown) {
      const parts = value.split(', ').map(p => p.trim())
      if (parts.length === 3) {
        // Format: "Town, Region, Country"
        setSelectedTown(parts[0])
        setSelectedRegion(parts[1])
        setSelectedCountry(parts[2])
      } else if (parts.length === 2) {
        // Try to match with country first
        const country = LOCATIONS.find(loc => loc.country === parts[1])
        if (country) {
          setSelectedTown(parts[0])
          setSelectedCountry(parts[1])
          // Try to find region
          for (const region of country.regions) {
            if (region.towns.includes(parts[0])) {
              setSelectedRegion(region.name)
              break
            }
          }
        }
      }
    }
  }, [value, selectedCountry, selectedRegion, selectedTown])

  const handleCountrySelect = (country: string) => {
    setSelectedCountry(country)
    setSelectedRegion('')
    setSelectedTown('')
  }

  const handleRegionSelect = (region: string) => {
    setSelectedRegion(region)
    setSelectedTown('')
  }

  const handleTownSelect = (town: string) => {
    setSelectedTown(town)
    const locationString = selectedRegion 
      ? `${town}, ${selectedRegion}, ${selectedCountry}`
      : `${town}, ${selectedCountry}`
    onChange(locationString)
    setShowDropdown(false)
  }

  const countries = getAllCountries()
  const regions = selectedCountry ? getRegionsByCountry(selectedCountry) : []
  const towns = selectedCountry && selectedRegion ? getTownsByRegion(selectedCountry, selectedRegion) : []

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-full px-2 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-primary-blue transition-colors flex items-center justify-between text-left"
      >
        <span className={value ? 'text-white' : 'text-gray-400'}>
          {value || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full bg-dark-card border border-white/10 rounded-lg shadow-xl max-h-96 overflow-hidden">
          <div className="overflow-y-auto max-h-96">
            {/* Country Selection */}
            {!selectedCountry && (
              <div className="p-2">
                <div className="text-xs font-semibold text-gray-400 mb-2 px-2">Select Country</div>
                {countries.map((country) => (
                  <button
                    key={country}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className="w-full px-3 py-2 text-sm text-left hover:bg-white/5 rounded-lg transition-colors"
                  >
                    {country}
                  </button>
                ))}
              </div>
            )}

            {/* Region Selection */}
            {selectedCountry && !selectedRegion && regions.length > 0 && (
              <div className="p-2">
                <button
                  type="button"
                  onClick={() => setSelectedCountry('')}
                  className="text-xs text-primary-blue mb-2 px-2 hover:underline"
                >
                  ← Back
                </button>
                <div className="text-xs font-semibold text-gray-400 mb-2 px-2">Select Region</div>
                {regions.map((region) => (
                  <button
                    key={region.name}
                    type="button"
                    onClick={() => handleRegionSelect(region.name)}
                    className="w-full px-3 py-2 text-sm text-left hover:bg-white/5 rounded-lg transition-colors"
                  >
                    {region.name}
                  </button>
                ))}
              </div>
            )}

            {/* Town Selection */}
            {selectedCountry && selectedRegion && towns.length > 0 && (
              <div className="p-2">
                <button
                  type="button"
                  onClick={() => setSelectedRegion('')}
                  className="text-xs text-primary-blue mb-2 px-2 hover:underline"
                >
                  ← Back to Regions
                </button>
                <div className="text-xs font-semibold text-gray-400 mb-2 px-2">Select Town</div>
                <div className="max-h-64 overflow-y-auto">
                  {towns.map((town) => (
                    <button
                      key={town}
                      type="button"
                      onClick={() => handleTownSelect(town)}
                      className="w-full px-3 py-2 text-sm text-left hover:bg-white/5 rounded-lg transition-colors"
                    >
                      {town}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  )
}

