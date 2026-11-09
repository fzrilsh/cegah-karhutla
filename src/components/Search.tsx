import { useState, useRef, useEffect } from 'react'
import { provinces, type Province } from '@/data/provinces'
import { useMapTransition } from '@/lib/map-transition'
import searchIcon from '@/assets/icons/search.svg'

interface SearchProps {
  readonly currentProvinceSlug?: string
  readonly className?: string
  readonly compact?: boolean
}

export function Search({ currentProvinceSlug, className, compact = false }: SearchProps) {
  const { enterProvince } = useMapTransition()
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const activeProvince = provinces.find((p) => p.slug === currentProvinceSlug)

  const filteredProvinces = provinces.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase().trim()),
  )

  const handleSelect = (province: Province) => {
    setQuery('')
    setIsOpen(false)
    enterProvince(province.slug)
  }

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  return (
    <div ref={containerRef} className={`relative ${isOpen ? 'z-50' : 'z-30'} ${className ?? ''}`}>
      <div className={`flex items-center justify-between rounded-[10px] border border-navy-700 bg-linear-to-r from-navy-800 to-navy-700 shadow-glow ${compact ? 'h-[42px] w-[230px] px-4' : 'h-[60px] w-[434px] px-[30px]'}`}>
        <input
          type="text"
          value={isOpen ? query : query || (activeProvince ? activeProvince.name : '')}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => {
            setIsOpen(true)
          }}
          placeholder="Cari Provinsi..."
          className={`w-full bg-transparent font-display text-paper placeholder:text-paper placeholder:opacity-30 focus:outline-none ${compact ? 'text-[15px]' : 'text-[20px]'}`}
        />
        <img src={searchIcon} alt="" className="size-[32px] shrink-0 opacity-80" />
      </div>

      {isOpen && (
        <ul className="absolute left-0 top-[68px] flex w-[434px] flex-col overflow-hidden rounded-[10px] border border-navy-700 bg-navy-800/95 shadow-glow backdrop-blur-md">
          {filteredProvinces.length > 0 ? (
            filteredProvinces.map((p) => (
              <li key={p.slug}>
                <button
                  type="button"
                  onClick={() => handleSelect(p)}
                  className="flex h-[44px] w-full cursor-pointer items-center px-[30px] font-display text-[18px] text-paper transition-colors hover:bg-navy-700 text-left"
                >
                  {p.name}
                </button>
              </li>
            ))
          ) : (
            <li className="flex h-[44px] items-center px-[30px] font-sans text-[14px] text-paper-2">
              Provinsi tidak ditemukan
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
