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
  // join
  profiles?: Pick<Profile, 'username'>
}

export interface Planet {
  id: string
  planet_name: string
  sector_id: string | null
  is_real: boolean
  planet_type: PlanetType
  coord_x: number
  coord_y: number
  coord_z: number
  price: number
  owner_id: string | null
  discovered_by: string | null
  purchased_at: string | null
  description: string | null
  // join
  profiles?: Pick<Profile, 'username'>
}

export type PlanetType =
  | 'earth-like'
  | 'crystal'
  | 'mechanical'
  | 'ice'
  | 'volcanic'
  | 'ocean'

export type DecorationItemType =
  | 'tree'
  | 'mountain'
  | 'river'
  | 'city'
  | 'spaceport'
  | 'monument'

export interface Decoration {
  id: string
  planet_id: string
  item_type: DecorationItemType
  pos_x: number
  pos_y: number
  placed_by: string | null
  created_at: string
}

// 지도에서 사용할 경량 타입
export interface MapPlanet {
  id: string
  planet_name: string
  planet_type: PlanetType
  coord_x: number
  coord_y: number
  owner_id: string | null
  is_real: boolean
}

export interface MapSector {
  id: string
  sector_name: string
  coord_x: number
  coord_y: number
  owner_id: string | null
}
