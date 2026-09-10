export type MediaItem = {
  id: string
  name: string
  type: 'image' | 'video' | 'document'
  src: string
  thumbnail: string
}

export type Album = {
  id: string
  title: string
  eyebrow: string
  date: string
  location: string
  description: string
  cover: string
  color: string
  media: MediaItem[]
}

const photo = (id: string, name: string, image: string): MediaItem => ({
  id,
  name,
  type: 'image',
  src: `${image}?auto=format&fit=crop&w=1800&q=88`,
  thumbnail: `${image}?auto=format&fit=crop&w=900&q=82`,
})

export const demoAlbums: Album[] = [
  {
    id: 'banff-winter-weekend',
    title: 'Banff Winter Weekend',
    eyebrow: 'Mountain escape',
    date: '2026-02-14',
    location: 'Banff, Alberta',
    description: 'Powder mornings, hot chocolate afternoons, and one very memorable frozen lake.',
    cover: 'https://images.unsplash.com/photo-1527489377706-5bf97e608852?auto=format&fit=crop&w=1800&q=88',
    color: '#7196a7',
    media: [
      photo('banff-1', 'Snow-covered peaks', 'https://images.unsplash.com/photo-1527489377706-5bf97e608852'),
      photo('banff-2', 'Lake Louise', 'https://images.unsplash.com/photo-1486911278844-a81c5267e227'),
      photo('banff-3', 'Cabin morning', 'https://images.unsplash.com/photo-1482192505345-5655af888cc4'),
      photo('banff-4', 'Mountain road', 'https://images.unsplash.com/photo-1517825738774-7de9363ef735'),
    ],
  },
  {
    id: 'amalfi-summer',
    title: 'Amalfi Summer',
    eyebrow: 'The big family trip',
    date: '2025-07-09',
    location: 'Amalfi Coast, Italy',
    description: 'Salt in our hair, long lunches, and golden evenings along the coast.',
    cover: 'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?auto=format&fit=crop&w=1800&q=88',
    color: '#d6794b',
    media: [
      photo('amalfi-1', 'Clifftop afternoon', 'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca'),
      photo('amalfi-2', 'Boats in the bay', 'https://images.unsplash.com/photo-1530789253388-582c481c54b0'),
      photo('amalfi-3', 'Italian summer', 'https://images.unsplash.com/photo-1529260830199-42c24126f198'),
      photo('amalfi-4', 'Dinner by the sea', 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963'),
    ],
  },
  {
    id: 'garden-forty',
    title: 'Maya Turns Forty',
    eyebrow: 'A garden celebration',
    date: '2025-05-24',
    location: 'Vancouver, BC',
    description: 'A backyard full of flowers, old friends, and dancing after dark.',
    cover: 'https://images.unsplash.com/photo-1507501336603-6e31db2be093?auto=format&fit=crop&w=1800&q=88',
    color: '#aa655a',
    media: [
      photo('party-1', 'Garden tables', 'https://images.unsplash.com/photo-1507501336603-6e31db2be093'),
      photo('party-2', 'A toast', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30'),
      photo('party-3', 'Summer flowers', 'https://images.unsplash.com/photo-1490750967868-88aa4486c946'),
      photo('party-4', 'After dark', 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce'),
    ],
  },
]
