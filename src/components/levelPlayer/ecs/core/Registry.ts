import { EntityManager } from "./EntityManager";
import { ComponentPool } from "./ComponentPool";
import { ComponentTypes as CT } from "./ComponentTypes";

type ComponentListener = (entityId: number, data: unknown) => void;

/**
 * Manages entities and their components.
 */
export class Registry {
  private entityManager = new EntityManager();
  private pools = new Map<number, ComponentPool>();
  private signatures = new Map<number, number>();
  private addListeners = new Map<number, ComponentListener[]>();
  private removeListeners = new Map<number, ComponentListener[]>();
  private bodyToEntity = new Map<number, number>();

  constructor() {
    for (const bit of Object.values(CT)) {
      if (typeof bit === "number") {
        this.pools.set(bit, new ComponentPool());
      }
    }
  }

  linkBody(entity: number, body: { id: number }): void {
    this.bodyToEntity.set(body.id, entity);
  }

  unlinkBody(bodyId: number): void {
    this.bodyToEntity.delete(bodyId);
  }

  getEntityByBodyId(bodyId: number): number | undefined {
    return this.bodyToEntity.get(bodyId);
  }

  getSignature(entity: number): number {
    return this.signatures.get(entity) ?? 0;
  }

  /**
   * Registers a callback for when a component type is added.
   */
  onComponentAdd(typeBit: number, callback: ComponentListener): void {
    if (!this.addListeners.has(typeBit)) this.addListeners.set(typeBit, []);
    this.addListeners.get(typeBit)!.push(callback);
  }

  /**
   * Registers a callback for when a component type is removed.
   */
  onComponentRemove(typeBit: number, callback: ComponentListener): void {
    if (!this.removeListeners.has(typeBit))
      this.removeListeners.set(typeBit, []);
    this.removeListeners.get(typeBit)!.push(callback);
  }

  /**
   * Creates a new entity.
   */
  createEntity(): number {
    const entity = this.entityManager.createEntity();
    this.signatures.set(entity, 0);
    return entity;
  }

  /**
   * Removes an entity and all its components.
   */
  destroyEntity(entity: number): void {
    const signature = this.signatures.get(entity);
    if (signature === undefined) return;

    for (const [bit, pool] of this.pools) {
      if ((signature & bit) === bit) {
        this.removeListeners
          .get(bit)
          ?.forEach((cb) => cb(entity, pool.get(entity)));
        pool.delete(entity);
      }
    }

    this.signatures.delete(entity);
    this.entityManager.destroyEntity(entity);
  }

  /**
   * Adds a component to an entity.
   */
  addComponent<T>(entity: number, typeBit: number, data: T): void {
    const pool = this.pools.get(typeBit);
    if (!pool) throw new Error(`Pool ${typeBit} not found`);

    pool.set(entity, data);
    const currentSig = this.signatures.get(entity) || 0;
    this.signatures.set(entity, currentSig | typeBit);

    this.addListeners.get(typeBit)?.forEach((cb) => cb(entity, data));
  }

  /**
   * Removes a component from an entity.
   */
  removeComponent(entity: number, typeBit: number): void {
    const pool = this.pools.get(typeBit);
    if (pool && this.hasComponent(entity, typeBit)) {
      this.removeListeners
        .get(typeBit)
        ?.forEach((cb) => cb(entity, pool.get(entity)));
      pool.delete(entity);
      const currentSig = this.signatures.get(entity) || 0;
      this.signatures.set(entity, currentSig & ~typeBit);
    }
  }

  /**
   * Returns a component from an entity.
   */
  getComponent<T>(entity: number, typeBit: number): T {
    const pool = this.pools.get(typeBit);
    return (pool ? pool.get(entity) : undefined) as T;
  }

  /**
   * Checks if an entity has a specific component.
   */
  hasComponent(entity: number, typeBit: number): boolean {
    const signature = this.signatures.get(entity);
    return signature !== undefined && (signature & typeBit) === typeBit;
  }

  /**
   * Returns IDs for entities that have all specified components.
   */
  view(typeBits: number[]): number[] {
    if (typeBits.length === 0) return [];

    const systemMask = typeBits.reduce((mask, bit) => mask | bit, 0);
    const pools = typeBits.map((bit) => this.pools.get(bit)!);

    let smallestPool = pools[0];
    for (let i = 1; i < pools.length; i++) {
      if (pools[i]!.size < smallestPool!.size) smallestPool = pools[i];
    }

    const result: number[] = [];
    for (const entityId of smallestPool!.getEntities()) {
      const entitySignature = this.signatures.get(entityId)!;

      if ((entitySignature & systemMask) === systemMask) {
        result.push(entityId);
      }
    }
    return result;
  }

  /**
   * Executes a callback for each entity with the specified components.
   */
//   forEach(
//     typeBits: number[],
//     callback: (entity: number, ...components: Component[]) => void,
//   ): void {
//     if (typeBits.length === 0) return;

//     const systemMask = typeBits.reduce((mask, bit) => mask | bit, 0);
//     const pools = typeBits.map((bit) => this.pools.get(bit)!);

//     let smallestPool = pools[0];
//     for (let i = 1; i < pools.length; i++) {
//       if (pools[i]!.size < smallestPool!.size) smallestPool = pools[i];
//     }

//     for (const entityId of smallestPool!.getEntities()) {
//       const entitySignature = this.signatures.get(entityId)!;

//       if ((entitySignature & systemMask) === systemMask) {
//         const args = typeBits.map(
//           (bit) => this.pools.get(bit)!.get(entityId) as Component,
//         );
//         callback(entityId, ...args);
//       }
//     }
//   }
}
