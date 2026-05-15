import { EntityManager } from "./EntityManager";
import { ComponentTypes as CT } from "./ComponentTypes";
import { Component } from "../components";

type EntityId = number;
type Signature = number;
type ComponentType = number;
/**
 * Manages entities and their components. TODO: ensure type safety in getComponent 
 */
export class Registry {
  private entityManager = new EntityManager();
  // for each component type we keep track of (entityId -> component data)
  private pools = new Map<ComponentType, Map<EntityId, Component>>();
  // each entity has its own signature based on the component(s) it has
  private signatures = new Map<EntityId, Signature>();
  // Matter bodyId -> entityId
  private bodyToEntity = new Map<number, EntityId>();

  constructor() {
    for (const bit of Object.values(CT)) {
      this.pools.set(bit, new Map<number, Component>());
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

    for (const bit of Object.values(CT)) {
      this.removeComponent(entity, bit);
    }

    this.signatures.delete(entity);
    this.entityManager.destroyEntity(entity);
  }

  /**
   * Adds a component to an entity.
   */
  addComponent(entity: number, typeBit: number, data: Component): void {
    const pool = this.pools.get(typeBit);
    if (!pool) throw new Error(`Pool ${typeBit} not found`);

    pool.set(entity, data);
    const currentSig = this.signatures.get(entity) || 0;
    this.signatures.set(entity, currentSig | typeBit);
  }

  /**
   * Removes a component from an entity.
   */
  removeComponent(entity: number, typeBit: number): void {
    const pool = this.pools.get(typeBit);
    if (pool && this.hasComponent(entity, typeBit)) {
      pool.delete(entity);
      const currentSig = this.signatures.get(entity) || 0;
      this.signatures.set(entity, currentSig & ~typeBit);
    }
  }

  /**
   * Returns a component from an entity. (use keyof and give type)
   */
  getComponent<T extends Component = Component>(
    entity: EntityId,
    typeBit: number,
  ): T | undefined {
    return this.pools.get(typeBit)?.get(entity) as T | undefined;
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
    const pools = typeBits.map((bit) => this.pools.get(bit)!)!;

    let smallestPool = pools[0]!;
    for (let i = 1; i < pools.length; i++) {
      const pool = pools[i]!;
      if (pool.size < smallestPool.size) smallestPool = pool;
    }

    const result: number[] = [];
    for (const entityId of smallestPool.keys()) {
      const entitySignature = this.signatures.get(entityId)!;

      if ((entitySignature & systemMask) === systemMask) {
        result.push(entityId);
      }
    }
    return result;
  }
}
