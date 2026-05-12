export class ComponentPool {
  private components = new Map<number, unknown>();

  get size(): number {
    return this.components.size;
  }

  set(entity: number, component: unknown): void {
    this.components.set(entity, component);
  }

  get<T = unknown>(entity: number): T | undefined {
    return this.components.get(entity) as T | undefined;
  }

  delete(entity: number): void {
    this.components.delete(entity);
  }

  getEntities(): Iterable<number> {
    return this.components.keys();
  }
}
