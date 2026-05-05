export class ComponentPool {
  private entities: number[] = [];
  private components: any[] = [];
  private entityToIndex = new Map<number, number>();

  get size(): number {
    return this.entities.length;
  }

  set(entity: number, component: any): void {
    if (this.entityToIndex.has(entity)) {
      this.components[this.entityToIndex.get(entity)!] = component;
    } else {
      this.entityToIndex.set(entity, this.entities.length);
      this.entities.push(entity);
      this.components.push(component);
    }
  }

  get(entity: number): any {
    const index = this.entityToIndex.get(entity);
    return index !== undefined ? this.components[index] : undefined;
  }

  delete(entity: number): void {
    const index = this.entityToIndex.get(entity);
    if (index === undefined) return;
    
    const lastIndex = this.entities.length - 1;
    if (index < lastIndex) {
      const lastEntity = this.entities[lastIndex];
      const lastComponent = this.components[lastIndex];
      
      this.entities[index] = lastEntity;
      this.components[index] = lastComponent;
      this.entityToIndex.set(lastEntity, index);
    }
    
    this.entities.pop();
    this.components.pop();
    this.entityToIndex.delete(entity);
  }

  getEntities(): number[] {
    return this.entities;
  }
}