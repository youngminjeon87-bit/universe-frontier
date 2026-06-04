export interface Profile {
  id: string
  username: string
  cash: number
  is_premium: boolean
  created_at: string
}

export interface Sector {
  id: string
  sector_name: string
  coord_x: number
  coord_y: number
  price: number
  owner_id: string | null
  purchased_at: string | null
  profiles?: Profile
}

export interface Planet {
  id: string
  planet_name: string
  sector_id: string | null
  is_real: boolean
  planet_type: 'earth-like' | 'crystal' | 'mechanical' | 'ice' | 'volcanic' | 'ocean'
  coord_x: number
  coord_y: number
  coord_z: number
  price: number
  owner_id: string | null
  discovered_by: string | null
  purchased_at: string | null
  description: string | null
  profiles?: Profile
}

export interface Decoration {
  id: string
  planet_id: string
  item_type: 'tree' | 'mountain' | 'river' | 'city' | 'spaceport' | 'monument'
  pos_x: number
  pos_y: number
  placed_by: string | null
  created_at: string
}
