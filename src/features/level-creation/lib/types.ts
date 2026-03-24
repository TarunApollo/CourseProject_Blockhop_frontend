export interface LevelCreator {
  id: string
  name: string
}

/*
 * Already test in Postman:
 * objectLayer: {}
 * worldLayer: {}
 */
export interface LevelResponse {
  id: string
  title: string
  description: string
  creator: LevelCreator
  published: boolean
  objectLayer: Record<string, never>
  worldLayer: Record<string, never>
}
