import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowUpRight, CalendarDays, Check, ChevronLeft, ChevronRight, FileText, Images, MapPin, Play, RefreshCw, Search, X } from 'lucide-react'
import { Album, demoAlbums, MediaItem } from './data'

const yearOf = (date: string) => new Date(`${date}T12:00:00`).getFullYear().toString()
const prettyDate = (date: string) => new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(`${date}T12:00:00`))

function App() {
  const [albums, setAlbums] = useState<Album[]>(demoAlbums)
  const [query, setQuery] = useState('')
  const [year, setYear] = useState('All years')
  const [activeAlbum, setActiveAlbum] = useState<Album | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [usingDemo, setUsingDemo] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [justRefreshed, setJustRefreshed] = useState(false)
  const [mediaFilter, setMediaFilter] = useState<'all' | MediaItem['type']>('all')

  const refreshGallery = useCallback((force = false) => {
    if (force) setIsRefreshing(true)
    const cacheKey = force ? Date.now() : Math.floor(Date.now() / 60_000)
    return fetch(`/.netlify/functions/drive-gallery?refresh=${cacheKey}`, { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => {
        if (Array.isArray(data.albums) && data.albums.length) {
          setAlbums(data.albums)
          setUsingDemo(false)
          if (force) {
            setJustRefreshed(true)
            window.setTimeout(() => setJustRefreshed(false), 2200)
          }
        }
      })
      .catch(() => undefined)
      .finally(() => setIsRefreshing(false))
  }, [])

  useEffect(() => {
    refreshGallery()
    const interval = window.setInterval(() => refreshGallery(), 60_000)
    return () => window.clearInterval(interval)
  }, [refreshGallery])

  const years = useMemo(() => ['All years', ...Array.from(new Set(albums.map((album) => yearOf(album.date)))).sort().reverse()], [albums])
  const filtered = useMemo(() => albums.filter((album) => {
    const matchesYear = year === 'All years' || yearOf(album.date) === year
    const haystack = `${album.title} ${album.location} ${album.description}`.toLowerCase()
    return matchesYear && haystack.includes(query.toLowerCase())
  }), [albums, query, year])
  const newestAlbum = useMemo(() => [...albums].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0], [albums])

  const closeAlbum = () => {
    setActiveAlbum(null)
    setLightboxIndex(null)
    setMediaFilter('all')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (activeAlbum) {
    const visibleMedia = mediaFilter === 'all' ? activeAlbum.media : activeAlbum.media.filter((item) => item.type === mediaFilter)
    const selected = lightboxIndex === null ? null : visibleMedia[lightboxIndex]
    const counts = {
      image: activeAlbum.media.filter((item) => item.type === 'image').length,
      video: activeAlbum.media.filter((item) => item.type === 'video').length,
      document: activeAlbum.media.filter((item) => item.type === 'document').length,
    }
    return (
      <main className="album-page">
        <header className="album-hero" style={{ backgroundImage: `linear-gradient(180deg, rgba(15,15,12,.18), rgba(15,15,12,.86)), url(${activeAlbum.cover})` }}>
          <nav className="topbar">
            <button className="brand" onClick={closeAlbum}>T<span>&</span>PU</button>
            <button className="back-button" onClick={closeAlbum}><ArrowLeft size={17} /> All memories</button>
          </nav>
          <div className="album-title-wrap">
            <p className="kicker">{activeAlbum.eyebrow}</p>
            <h1>{activeAlbum.title}</h1>
            <div className="album-meta"><span><CalendarDays size={16} /> {prettyDate(activeAlbum.date)}</span><span><MapPin size={16} /> {activeAlbum.location}</span></div>
          </div>
        </header>
        <section className="album-content">
          <div className="album-intro">
            <p>{activeAlbum.description}</p>
            <span><Images size={18} /> {activeAlbum.media.length} memories</span>
          </div>
          <div className="media-tabs" role="tablist" aria-label="Album content">
            <button className={mediaFilter === 'all' ? 'active' : ''} onClick={() => { setMediaFilter('all'); setLightboxIndex(null) }}>All <span>{activeAlbum.media.length}</span></button>
            <button className={mediaFilter === 'image' ? 'active' : ''} onClick={() => { setMediaFilter('image'); setLightboxIndex(null) }}>Photos <span>{counts.image}</span></button>
            <button className={mediaFilter === 'video' ? 'active' : ''} onClick={() => { setMediaFilter('video'); setLightboxIndex(null) }}>Videos <span>{counts.video}</span></button>
            <button className={mediaFilter === 'document' ? 'active' : ''} onClick={() => { setMediaFilter('document'); setLightboxIndex(null) }}>Documents <span>{counts.document}</span></button>
          </div>
          <div className="masonry">
            {visibleMedia.map((item, index) => (
              <button className={`media-tile tile-${index % 4}`} key={item.id} onClick={() => setLightboxIndex(index)} aria-label={`Open ${item.name}`}>
                <img src={item.thumbnail} alt={item.name} loading="lazy" />
                {item.type === 'video' && <span className="play"><Play fill="currentColor" /></span>}
                {item.type === 'document' && <span className="play document-icon"><FileText /></span>}
                <span className="media-name">{item.name}</span>
              </button>
            ))}
          </div>
          {!visibleMedia.length && <div className="empty"><h3>No {mediaFilter === 'image' ? 'photos' : mediaFilter === 'all' ? 'items' : `${mediaFilter}s`} yet</h3><p>Add them to this album’s Google Drive folder, then refresh.</p></div>}
        </section>
        {selected && <Lightbox item={selected} index={lightboxIndex!} total={visibleMedia.length} onClose={() => setLightboxIndex(null)} onMove={(step) => setLightboxIndex((lightboxIndex! + step + visibleMedia.length) % visibleMedia.length)} />}
      </main>
    )
  }

  return (
    <main>
      <header className="home-hero" style={newestAlbum ? { backgroundImage: `linear-gradient(90deg, rgba(20,25,18,.72), rgba(20,25,18,.08)), url(${newestAlbum.cover})` } : undefined}>
        <nav className="topbar">
          <div className="brand">T<span>&</span>PU</div>
          <a href="#memories" className="nav-link">Browse memories <ArrowUpRight size={16} /></a>
        </nav>
        <div className="hero-copy">
          <p className="kicker">Newest memory · {newestAlbum?.title ?? 'Our shared story'}</p>
          <h1>Trips and Parties<br /><em>Unlimited.</em></h1>
          <p className="hero-subtitle">A living collection of faraway places, loud celebrations, and the people who made them unforgettable.</p>
          {newestAlbum && <button className="hero-album-link" onClick={() => { setActiveAlbum(newestAlbum); window.scrollTo(0, 0) }}>
            Explore {newestAlbum.title} <ArrowUpRight size={17} />
          </button>}
        </div>
        <div className="hero-foot"><span>Scroll to wander</span><span>{albums.length} stories · {albums.reduce((sum, album) => sum + album.media.length, 0)} memories</span></div>
      </header>

      <section className="collection" id="memories">
        <div className="section-heading">
          <div><p className="kicker dark">The collection</p><h2>Where should we<br />go back to?</h2></div>
          <p>Every folder holds a story. Choose one and step back inside.</p>
        </div>
        <div className="filters">
          <label className="search"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search places and moments" /></label>
          <div className="filter-actions">
            <div className="years" aria-label="Filter albums by year">
              {years.map((item) => <button className={item === year ? 'active' : ''} key={item} onClick={() => setYear(item)}>{item}</button>)}
            </div>
            {!usingDemo && <button className={`refresh-button ${justRefreshed ? 'success' : ''}`} onClick={() => refreshGallery(true)} disabled={isRefreshing}>
              {justRefreshed ? <Check size={15} /> : <RefreshCw size={15} className={isRefreshing ? 'spin' : ''} />}
              {justRefreshed ? 'Up to date' : isRefreshing ? 'Refreshing…' : 'Refresh memories'}
            </button>}
          </div>
        </div>
        <div className="album-grid">
          {filtered.map((album, index) => (
            <button className={`album-card card-${index % 3}`} key={album.id} onClick={() => { setActiveAlbum(album); window.scrollTo(0, 0) }}>
              <div className="card-copy"><div><p>{album.eyebrow}</p><h3>{album.title}</h3></div><ArrowUpRight /></div>
              <div className="card-image"><img src={album.cover} alt="" /><span className="count"><Images size={15} /> {album.media.length}</span></div>
              <div className="card-meta"><span>{album.location}</span><span>{yearOf(album.date)}</span></div>
            </button>
          ))}
        </div>
        {!filtered.length && <div className="empty"><h3>No memories found</h3><p>Try another search or year.</p></div>}
      </section>

      <footer><div className="brand">T<span>&</span>PU</div><p>Made for the people who were there.</p>{usingDemo && <span className="demo-note">Preview collection</span>}</footer>
    </main>
  )
}

function Lightbox({ item, index, total, onClose, onMove }: { item: MediaItem; index: number; total: number; onClose: () => void; onMove: (step: number) => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft') onMove(-1)
      if (event.key === 'ArrowRight') onMove(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, onMove])

  return <div className="lightbox" role="dialog" aria-modal="true" aria-label={item.name}>
    <button className="lightbox-close" onClick={onClose} aria-label="Close"><X /></button>
    <button className="lightbox-nav prev" onClick={() => onMove(-1)} aria-label="Previous"><ChevronLeft /></button>
    {item.type === 'image' ? <img src={item.src} alt={item.name} /> : <iframe className="drive-preview" src={item.src} title={item.name} allow="autoplay" />}
    <button className="lightbox-nav next" onClick={() => onMove(1)} aria-label="Next"><ChevronRight /></button>
    <div className="lightbox-caption"><span>{item.name}</span><span>{index + 1} / {total}</span></div>
  </div>
}

export default App
