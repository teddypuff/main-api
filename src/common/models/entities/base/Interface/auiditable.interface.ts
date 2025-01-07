export interface IAuditableEntity {
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt?: Date;
}
