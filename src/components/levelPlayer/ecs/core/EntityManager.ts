export class EntityManager {
  private nextEntityId = 1;
  private activeEntities = new Set<number>();

  createEntity(): number {
    const id = this.nextEntityId++;
    this.activeEntities.add(id);
    return id;
  }

  destroyEntity(id: number): void {
    this.activeEntities.delete(id);
  }
}